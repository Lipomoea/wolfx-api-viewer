const EARTH_RADIUS_KM: f64 = 6371.0;

fn calc_line_dis(dep: f64, dis: f64) -> f64 {
    let theta = dis / EARTH_RADIUS_KM;
    let a = EARTH_RADIUS_KM - dep;
    (a * a + EARTH_RADIUS_KM * EARTH_RADIUS_KM - 2.0 * a * EARTH_RADIUS_KM * theta.cos()).sqrt()
}

fn calc_cea_csis(m: f64, dis: f64) -> f64 {
    1.297 * m - 4.368 * (dis + 15.0).log10() + 5.363
}

fn csis_to_level(csis: f64) -> i32 {
    csis.clamp(0.0, 12.0).round() as i32
}

#[no_mangle]
pub extern "C" fn calc_surface_distance_km(lat1: f64, lng1: f64, lat2: f64, lng2: f64) -> f64 {
    let d_lat = (lat2 - lat1).to_radians();
    let d_lng = (lng2 - lng1).to_radians();
    let r_lat1 = lat1.to_radians();
    let r_lat2 = lat2.to_radians();
    let a = (d_lat / 2.0).sin().powi(2)
        + r_lat1.cos() * r_lat2.cos() * (d_lng / 2.0).sin().powi(2);
    2.0 * EARTH_RADIUS_KM * a.sqrt().atan2((1.0 - a).sqrt())
}

#[no_mangle]
pub extern "C" fn calc_csis(m: f64, dep: f64, dis: f64) -> f64 {
    if !m.is_finite() || !dis.is_finite() || dis > 10000.0 {
        return 0.0;
    }

    let dep = if !dep.is_finite() || dep < 10.0 { 10.0 } else { dep };
    let line_dis = calc_line_dis(dep, dis);
    let long = 10.0_f64.powf((m - 3.821) / 1.86);
    let hypo_dis = (line_dis - 10.0 - long)
        .max(dis - long)
        .max(0.2 * (line_dis - 10.0))
        .max(0.0);
    let cea_csis1 = calc_cea_csis(m, dis);
    let cea_csis2 = calc_cea_csis(m, hypo_dis);
    (cea_csis1 + cea_csis2) / 2.0
}

#[no_mangle]
pub extern "C" fn calc_csis_level(m: f64, dep: f64, dis: f64) -> i32 {
    csis_to_level(calc_csis(m, dep, dis))
}
