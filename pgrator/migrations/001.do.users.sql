BEGIN;

CREATE OR REPLACE FUNCTION record_user_updated_at() RETURNS TRIGGER AS
$$
BEGIN
    IF pg_trigger_depth() <> 1 THEN
        RETURN new;
    END IF;
    UPDATE users u SET updated_at = current_timestamp WHERE u.id = new.id;
    RETURN new;
END;
$$ LANGUAGE PLPGSQL;


CREATE TABLE IF NOT EXISTS users
(
    id                          VARCHAR(26) PRIMARY KEY,
    email                       TEXT UNIQUE,
    email_verified              BOOLEAN     NOT NULL DEFAULT false,
    phone_number                TEXT UNIQUE,
    phone_number_verified       BOOLEAN     NOT NULL DEFAULT false,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE OR REPLACE TRIGGER record_user_update_date
    AFTER UPDATE
    ON users
    FOR EACH ROW
EXECUTE PROCEDURE record_user_updated_at();




COMMIT;

