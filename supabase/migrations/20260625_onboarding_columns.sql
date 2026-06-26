-- Columnas adicionales de onboarding en profiles
-- Ejecutar en Supabase SQL Editor si no existen aún

alter table public.profiles
  add column if not exists pais           text,
  add column if not exists tipo_creador   text,
  add column if not exists red_principal  text;
