<template>
  <div class="weather" v-if="weatherData.city && weatherData.weather.weather">
    <span>{{ weatherData.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith("风")
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower }}&nbsp;级</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getXiaomiCityByGeo, getXiaomiWeather } from "@/api";
import { Error } from "@icon-park/vue-next";

// 固定城市坐标（在 .env 配置 VITE_WEATHER_LON / VITE_WEATHER_LAT）
// 留空则回退到浏览器定位（会弹授权框）
const fixedLon = import.meta.env.VITE_WEATHER_LON;
const fixedLat = import.meta.env.VITE_WEATHER_LAT;

// 天气数据
const weatherData = reactive({
  city: null, // 城市
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

// 天气代码转文字
const getWeatherText = (code) => {
  const weatherMap = {
    0: "晴", 1: "多云", 2: "阴", 3: "阵雨", 4: "雷阵雨",
    5: "雷阵雨伴有冰雹", 6: "雨夹雪", 7: "小雨", 8: "中雨",
    9: "大雨", 10: "暴雨", 13: "阵雪", 14: "小雪",
    15: "中雪", 16: "大雪", 17: "暴雪", 18: "雾",
    19: "冻雨", 20: "沙尘暴", 29: "浮尘", 30: "扬沙",
    31: "强沙尘暴", 32: "霾",
  };
  return weatherMap[code] || "未知";
};

// 风向角度转文字
const getWindDirection = (degree) => {
  const directions = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  const index = Math.round((degree % 360) / 45) % 8;
  return directions[index];
};

// 获取坐标：优先用固定城市，否则回退浏览器定位
const resolveCoords = async () => {
  if (fixedLon && fixedLat) {
    return { longitude: Number(fixedLon), latitude: Number(fixedLat) };
  }
  const position = await new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject("浏览器不支持定位");
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
  });
  return { longitude: position.coords.longitude, latitude: position.coords.latitude };
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    const { longitude, latitude } = await resolveCoords();

    // 获取城市信息（含 locationKey）
    const cityInfo = await getXiaomiCityByGeo(longitude, latitude);
    if (!cityInfo || !cityInfo.locationKey) {
      throw "城市信息获取失败";
    }
    weatherData.city = cityInfo.name;

    // 获取天气信息
    const result = await getXiaomiWeather(latitude, longitude, cityInfo.locationKey);
    if (!result.current) {
      throw "天气数据获取失败";
    }

    const current = result.current;
    const windDegree = parseFloat(current.wind?.direction?.value || 0);
    const windSpeed = parseFloat(current.wind?.speed?.value || 0);
    // 风速转风力等级（简化计算）
    const windPower = Math.min(Math.ceil(windSpeed / 5), 12);

    weatherData.weather = {
      weather: getWeatherText(current.weather),
      temperature: current.temperature?.value,
      winddirection: getWindDirection(windDegree),
      windpower: windPower,
    };
  } catch (error) {
    console.error("天气信息获取失败:", error);
    onError("天气信息获取失败");
  }
};

// 报错信息
const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message);
};

onMounted(() => {
  getWeatherData();
});
</script>
