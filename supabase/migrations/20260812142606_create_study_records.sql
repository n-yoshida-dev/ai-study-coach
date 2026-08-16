CREATE TABLE study_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  study_date date NOT NULL,
  category text NOT NULL,
  duration_minutes integer NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT check_duration_minutes CHECK (
    duration_minutes >= 1
    AND duration_minutes <= 1440
  ),
  CONSTRAINT check_category_not_blank CHECK (char_length(trim(category)) > 0),
  CONSTRAINT check_category_length CHECK (char_length(category) <= 50),
  CONSTRAINT check_note_length CHECK (char_length(note) <= 500)
);

CREATE INDEX idx_study_records_user_id ON study_records (user_id);

-- updated_at を UPDATE のたびに自動更新する。
-- バックエンドが無く、SQL Editor からの直接更新もあるため DB 側で行う。
-- search_path を空に固定するのは、関数内の名前解決を呼び出し側に操作させないため。
CREATE FUNCTION set_updated_at () RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
  AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER study_records_set_updated_at
  BEFORE UPDATE ON study_records
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at ();

-- 行レベルの分離。ポリシーが無い操作は拒否される。
-- ブラウザが直接 DB を叩く構成のため、ここが唯一の防御線になる。
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_study_records" ON study_records
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid ()));

-- WITH CHECK が無いと、他人の user_id を詐称した行を挿入できる。
CREATE POLICY "insert_own_study_records" ON study_records
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid ()));

-- USING = 更新対象にできる行、WITH CHECK = 更新後の行が満たすべき条件。
-- WITH CHECK が無いと、自分の行の user_id を他人に書き換えて渡せてしまう。
CREATE POLICY "update_own_study_records" ON study_records
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid ()))
  WITH CHECK (user_id = (SELECT auth.uid ()));

CREATE POLICY "delete_own_study_records" ON study_records
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid ()));
