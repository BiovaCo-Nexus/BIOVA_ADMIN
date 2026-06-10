-- First, let's create the contact_location table function
CREATE OR REPLACE FUNCTION get_contact_location()
RETURNS TABLE (
    id integer,
    latitude numeric,
    longitude numeric,
    address text,
    city varchar,
    state varchar,
    country varchar,
    postal_code varchar,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.id,
        cl.latitude,
        cl.longitude,
        cl.address,
        cl.city,
        cl.state,
        cl.country,
        cl.postal_code,
        cl.is_active,
        cl.created_at,
        cl.updated_at
    FROM contact_location cl
    WHERE cl.is_active = true
    ORDER BY cl.created_at DESC;
END;
$$;