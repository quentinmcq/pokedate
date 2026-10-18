CREATE TABLE pokemon_reveal_counts (
  day TEXT NOT NULL,
  pokemon_id INTEGER NOT NULL CHECK (pokemon_id BETWEEN 1 AND 1025),
  count INTEGER NOT NULL DEFAULT 0,
  shiny_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, pokemon_id)
);
