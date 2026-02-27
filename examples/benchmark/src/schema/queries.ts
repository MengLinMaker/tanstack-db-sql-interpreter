export const queries = {
  'select home_table': `SELECT home_table.*
FROM home_table`,

  'aggregate home_table': `SELECT
  1 as id,
  COUNT(*) AS count_home,
  MIN(h.higher_price_aud) AS min_price,
  AVG(h.higher_price_aud) AS avg_price,
  MAX(h.higher_price_aud) AS max_price
FROM home_table h`,

  'select home data': `SELECT
  h.id,
  h.higher_price_aud,
  hf.bed_quantity,
  hf.bath_quantity,
  hf.car_quantity,
  h.street_address,
  lf.suburb_name,
  lf.state_abbreviation,
  lf.postcode
FROM home_table h
JOIN locality_table lf ON lf.id = h.locality_table_id
JOIN home_feature_table hf ON hf.id = h.home_feature_table_id
ORDER BY h.higher_price_aud DESC`,

  'group by state': `SELECT
  state_abbreviation AS id,
  state_abbreviation,
  AVG(hf.bed_quantity) AS avg_beds,
  AVG(hf.bath_quantity) AS avg_baths,
  AVG(hf.car_quantity) AS avg_cars,
  COUNT(h.id) AS home_count
FROM home_table h
JOIN locality_table lf ON lf.id = h.locality_table_id
JOIN home_feature_table hf ON hf.id = h.home_feature_table_id
GROUP BY state_abbreviation
ORDER BY home_count DESC`,
}