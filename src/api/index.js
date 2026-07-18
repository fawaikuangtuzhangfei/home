// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  const data = await res.json();

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气（小米天气 API）
 * 小米接口跨域且需要 UA 头，浏览器无法直连，需经代理。
 * 代理地址由 VITE_WEATHER_PROXY 指定，默认 /wtr（同源，由 Nginx 反代到
 * https://weatherapi.market.xiaomi.com/wtr-v3/ ）。
 */
const PROXY_BASE_URL = import.meta.env.VITE_WEATHER_PROXY || "/wtr";

// 根据经纬度获取城市信息（含 locationKey）
export const getXiaomiCityByGeo = async (longitude, latitude) => {
  const url = `${PROXY_BASE_URL}/location/city/geo?longitude=${longitude}&latitude=${latitude}&locale=zh_cn`;
  const response = await fetch(url);
  const data = await response.json();
  return data?.[0];
};

// 获取天气信息
export const getXiaomiWeather = async (latitude, longitude, locationKey) => {
  const url = `${PROXY_BASE_URL}/weather/all?latitude=${latitude}&longitude=${longitude}&locationKey=${encodeURIComponent(
    locationKey,
  )}&days=15&appKey=weather20151024&sign=zUFJoAR2ZVrDy1vF3D07&isGlobal=false&locale=zh_cn`;
  const response = await fetch(url);
  return await response.json();
};
