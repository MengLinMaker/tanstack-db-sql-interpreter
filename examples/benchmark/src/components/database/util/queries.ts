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

  'top suburbs by average price': `SELECT
  lf.id,
  lf.suburb_name,
  lf.state_abbreviation,
  AVG(h.higher_price_aud) AS avg_price,
  COUNT(h.id) AS home_count
FROM home_table h
JOIN locality_table lf ON lf.id = h.locality_table_id
GROUP BY lf.id, lf.suburb_name, lf.state_abbreviation
HAVING COUNT(h.id) > 5
ORDER BY avg_price DESC
LIMIT 50`,

  'homes per feature combo': `SELECT
  CONCAT(hf.bed_quantity, '-', hf.bath_quantity, '-', hf.car_quantity) AS id,
  hf.bed_quantity,
  hf.bath_quantity,
  hf.car_quantity,
  COUNT(h.id) AS home_count,
  AVG(h.higher_price_aud) AS avg_price
FROM home_table h
JOIN home_feature_table hf ON hf.id = h.home_feature_table_id
GROUP BY hf.bed_quantity, hf.bath_quantity, hf.car_quantity
ORDER BY home_count DESC`,

  'price deciles': `SELECT
  (width_bucket(h.higher_price_aud, 0, 2000000, 10) || '-' ||
    MIN(h.higher_price_aud) || '-' || MAX(h.higher_price_aud)
  ) AS id,
  width_bucket(h.higher_price_aud, 0, 2000000, 10) AS decile,
  COUNT(*) AS home_count,
  AVG(h.higher_price_aud) AS avg_price,
  MIN(h.higher_price_aud) AS min_price,
  MAX(h.higher_price_aud) AS max_price
FROM home_table h
GROUP BY decile
ORDER BY decile`,

  'median price by state': `SELECT
  lf.state_abbreviation AS id,
  lf.state_abbreviation,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY h.higher_price_aud) AS median_price,
  COUNT(h.id) AS home_count
FROM home_table h
JOIN locality_table lf ON lf.id = h.locality_table_id
GROUP BY lf.state_abbreviation
ORDER BY median_price DESC`,
}
