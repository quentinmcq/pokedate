CREATE TABLE draws (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pokemon_id INTEGER NOT NULL CHECK (pokemon_id BETWEEN 1 AND 1025),
  shiny INTEGER NOT NULL DEFAULT 0 CHECK (shiny IN (0, 1)),
  nickname TEXT NOT NULL CHECK (length(nickname) BETWEEN 2 AND 20),
  created_at INTEGER NOT NULL
);

CREATE INDEX draws_created_at ON draws (created_at);
CREATE INDEX draws_nickname_created_at ON draws (nickname, created_at);
