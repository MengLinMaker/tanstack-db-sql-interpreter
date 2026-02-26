export const sqlSchema = `
CREATE TABLE
    IF NOT EXISTS home_feature_table (
        id integer NOT NULL PRIMARY KEY,
        bed_quantity integer NOT NULL,
        bath_quantity integer NOT NULL,
        car_quantity integer NOT NULL,
        CONSTRAINT home_feature_table_unique UNIQUE (bed_quantity, bath_quantity, car_quantity)
    );

CREATE INDEX IF NOT EXISTS home_feature_table_bed_quantity_idx ON home_feature_table (bed_quantity);

CREATE INDEX IF NOT EXISTS home_feature_table_bath_quantity_idx ON home_feature_table (bath_quantity);

CREATE INDEX IF NOT EXISTS home_feature_table_car_quantity_idx ON home_feature_table (car_quantity);

CREATE TABLE
    IF NOT EXISTS locality_table (
        id integer NOT NULL PRIMARY KEY,
        suburb_name text NOT NULL,
        postcode text NOT NULL,
        state_abbreviation text NOT NULL,
        CONSTRAINT locality_table_suburb_name_postcode_state_abbreviation_unique UNIQUE (suburb_name, postcode, state_abbreviation)
    );

CREATE INDEX IF NOT EXISTS locality_table_suburb_name_idx ON locality_table (suburb_name);

CREATE INDEX IF NOT EXISTS locality_table_postcode_idx ON locality_table (postcode);

CREATE INDEX IF NOT EXISTS locality_table_state_abbreviation_idx ON locality_table (state_abbreviation);

CREATE TABLE
    IF NOT EXISTS home_table (
        id integer NOT NULL PRIMARY KEY,
        locality_table_id integer NOT NULL REFERENCES locality_table (id),
        home_feature_table_id integer NOT NULL REFERENCES home_feature_table (id),
        street_address text NOT NULL,
        higher_price_aud integer NOT NULL,
        CONSTRAINT home_table_locality_table_id_street_address_unique UNIQUE (locality_table_id, street_address)
    );

CREATE INDEX IF NOT EXISTS home_table_home_feature_table_id_idx ON home_table (home_feature_table_id);

CREATE INDEX IF NOT EXISTS home_table_locality_table_id_idx ON home_table (locality_table_id);

CREATE INDEX IF NOT EXISTS home_table_locality_higher_price_aud ON home_table (higher_price_aud);
`
