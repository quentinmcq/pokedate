ALTER TABLE draws ADD COLUMN bonus_pokemon_id INTEGER CHECK (bonus_pokemon_id IS NULL OR bonus_pokemon_id BETWEEN 1001 AND 1025);
