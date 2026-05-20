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

fn jma_shindo_to_level(inst_shindo: f64) -> i32 {
    let rounded = ((inst_shindo * 100.0).round() / 10.0).floor() / 10.0;
    if rounded < 0.5 {
        0
    } else if rounded < 1.5 {
        1
    } else if rounded < 2.5 {
        2
    } else if rounded < 3.5 {
        3
    } else if rounded < 4.5 {
        4
    } else if rounded < 5.0 {
        5
    } else if rounded < 5.5 {
        6
    } else if rounded < 6.0 {
        7
    } else if rounded < 6.5 {
        8
    } else {
        9
    }
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

#[no_mangle]
pub extern "C" fn calc_jma_shindo(
    mj: f64,
    dep: f64,
    hypo_lat: f64,
    hypo_lng: f64,
    loc_lat: f64,
    loc_lng: f64,
    arv: f64,
) -> f64 {
    let mw = mj - 0.171;
    let long = 10.0_f64.powf(0.5 * mw - 1.85) / 2.0;
    let surface_dist = calc_surface_distance_km(hypo_lat, hypo_lng, loc_lat, loc_lng);
    let line_dis = calc_line_dis(dep, surface_dist);
    let hypo_dist = line_dis - long;
    let x = hypo_dist.max(3.0);
    let pgv600 = 10.0_f64.powf(
        0.58 * mw + 0.0038 * dep
            - 1.29
            - (x + 0.0028 * 10.0_f64.powf(0.5 * mw)).log10()
            - 0.002 * x,
    );
    let pgv400 = pgv600 * 1.307;
    let pgv = pgv400 * arv;
    2.68 + 1.72 * pgv.log10()
}

#[no_mangle]
pub extern "C" fn calc_jma_shindo_level(
    mj: f64,
    dep: f64,
    hypo_lat: f64,
    hypo_lng: f64,
    loc_lat: f64,
    loc_lng: f64,
    arv: f64,
) -> i32 {
    jma_shindo_to_level(calc_jma_shindo(
        mj, dep, hypo_lat, hypo_lng, loc_lat, loc_lng, arv,
    ))
}
