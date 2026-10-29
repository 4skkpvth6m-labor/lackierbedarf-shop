-- Lackierbedarf B2B-Shop: Grundschema
-- Im Supabase SQL-Editor ausführen (oder per `supabase db push`).
--
-- Sicherheitsmodell: Alle Tabellen haben RLS aktiv und KEINE Policies für
-- anon/authenticated. Gelesen und geschrieben wird ausschließlich serverseitig
-- mit dem Service-Role-Key. So kann niemand mit dem öffentlichen Anon-Key
-- Listenpreise, Rabatte oder fremde Bestellungen abfragen.

create extension if not exists pg_trgm with schema extensions;

create table public.categories (
  id serial primary key,
  name text not null unique,
  slug text not null unique,
  sort int not null default 0
);

create table public.products (
  id bigserial primary key,
  sku text not null unique,                 -- Artikelnummer
  order_no text,                            -- Bestellnummer des Herstellers
  name text not null,
  variant text,
  brand text,
  category_id int not null references public.categories(id),
  catalog_page int,
  list_price numeric(10,2),                 -- Listenpreis netto; null = Preis auf Anfrage
  description text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_search_idx on public.products
  using gin ((sku || ' ' || coalesce(order_no,'') || ' ' || name || ' ' || coalesce(variant,'') || ' ' || coalesce(brand,'')) extensions.gin_trgm_ops);

create type public.customer_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  company text not null default '',
  contact_name text not null default '',
  street text not null default '',
  zip text not null default '',
  city text not null default '',
  phone text not null default '',
  vat_id text not null default '',
  customer_no text,
  status public.customer_status not null default 'pending',
  is_admin boolean not null default false,
  -- Rabatt in Prozent, der auf ALLE Kategorien gilt, sofern für eine
  -- Kategorie kein eigener Rabatt hinterlegt ist.
  discount_all numeric(5,2) not null default 0 check (discount_all between 0 and 100),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- Abweichender Rabatt pro Kunde und Kategorie (überschreibt discount_all).
create table public.customer_category_discounts (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  category_id int not null references public.categories(id) on delete cascade,
  percent numeric(5,2) not null check (percent between 0 and 100),
  primary key (customer_id, category_id)
);

create type public.order_status as enum ('neu', 'in_bearbeitung', 'versendet', 'storniert');

create table public.orders (
  id bigserial primary key,
  customer_id uuid not null references public.profiles(id),
  status public.order_status not null default 'neu',
  note text not null default '',
  total_net numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  sku text not null,
  name text not null,
  quantity int not null check (quantity > 0),
  list_price numeric(10,2),
  discount_percent numeric(5,2) not null default 0,
  unit_price numeric(10,2)
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.customer_category_discounts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- E-Mail-Adressen, die bei der Registrierung automatisch Admin werden.
create table public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;
insert into public.admin_emails values ('dkalina25@icloud.com');

-- Profil automatisch anlegen, sobald sich jemand registriert.
-- Status ist immer 'pending'; Freigabe nur durch den Admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, company, contact_name, street, zip, city, phone, vat_id, is_admin, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'company', ''),
    coalesce(new.raw_user_meta_data->>'contact_name', ''),
    coalesce(new.raw_user_meta_data->>'street', ''),
    coalesce(new.raw_user_meta_data->>'zip', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'vat_id', ''),
    exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)),
    case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then 'approved'::public.customer_status else 'pending' end
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.categories (name, slug, sort) values
  ('Arbeitsschutz', 'arbeitsschutz', 1),
  ('Abdecken', 'abdecken', 2),
  ('Lackierpistolen', 'lackierpistolen', 3),
  ('Schleifmittel', 'schleifmittel', 4),
  ('Schleifmaschinen', 'schleifmaschinen', 5),
  ('Poliersysteme', 'poliersysteme', 6),
  ('Staubabsaugung', 'staubabsaugung', 7),
  ('Werkstattausrüstung', 'werkstattausruestung', 8),
  ('Zubehör & Verbrauchsmaterial', 'zubehoer-verbrauchsmaterial', 9),
  ('Chemische Produkte', 'chemische-produkte', 10);

-- Artikelanzahl je Kategorie für die Startseite.
create or replace function public.category_counts()
returns table (category_id int, n bigint)
language sql stable
set search_path = public
as $$ select category_id, count(*) from public.products where active group by category_id $$;
revoke execute on function public.category_counts() from public, anon, authenticated;
