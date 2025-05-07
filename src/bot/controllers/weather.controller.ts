import axios from "axios";

const API_KEY = "df8172766924437e90c181751242207"; // Replace with your actual WeatherAPI key

const weatherService = async (ctx:any, city: any) => {
  const chatId = ctx.message.from.id

  try {
    const response = await axios.get(
      `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=1&aqi=no&alerts=no`
    );

    const data = response.data;
    const iconUrl = `http:${data.current.condition.icon}`;
    const weatherDescription = generateWeatherDescription(data);

    const res = await ctx.replyWithPhoto({url: iconUrl}, {
      caption: weatherDescription,
      parse_mode: "Markdown",
    });

    if(res){
      return true;
    }

  } catch (error: any) {
    console.error("Error fetching weather data:", error.message);
    await ctx.sendMessage(
      chatId,
      "⚠️ Sorry, I couldn't fetch the weather right now. Please try again later."
    );
  }
};

const generateWeatherDescription = (data: any) => {
  const { location, current, forecast } = data;
  const forecastDay = forecast.forecastday[0].astro;

  const sunrise = forecastDay.sunrise || "N/A";
  const sunset = forecastDay.sunset || "N/A";

  const windDir = getWindDirection(current.wind_degree);

  let description = `🌦 *Weather for ${location.name}, ${location.country}*\n\n`;
  description += `📍 *Condition:* ${current.condition.text}\n`;
  description += `🌡 *Temperature:* ${Math.round(current.temp_c)}°C (Feels like ${Math.round(current.feelslike_c)}°C)\n`;
  description += `💧 *Humidity:* ${current.humidity}%\n`;
  description += `💨 *Wind:* ${current.wind_kph} km/h from ${windDir}\n`;
  description += `🧭 *Pressure:* ${current.pressure_mb} hPa\n`;
  description += `🌅 *Sunrise:* ${sunrise} | 🌇 *Sunset:* ${sunset}\n\n`;

  description += generateWeatherAdvice(current.temp_c, current.condition.code, current.wind_kph);
  return description;
};

const getWindDirection = (degree: any) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degree / 45) % 8];
};

const generateWeatherAdvice = (temp:any, code:any, wind:any) => {
  let advice = "💡 *Advice:*\n";

  // Temperature Advice
  if (temp < 5) {
    advice += "• 🧥 Very cold. Dress warmly and limit time outside.\n";
  } else if (temp < 15) {
    advice += "• 🧣 Chilly. A jacket or sweater is recommended.\n";
  } else if (temp > 30) {
    advice += "• 🥵 Hot day. Stay hydrated and avoid direct sunlight.\n";
  } else if (temp > 20) {
    advice += "• 🌞 Pleasant and warm. Ideal for outdoor activities.\n";
  } else {
    advice += "• 🌤 Mild weather. Comfortable to be outside.\n";
  }

  // Weather Condition Code Logic (grouped by code ranges)
  if (code === 1000) {
    advice += "• ☀️ Clear skies — perfect for a walk or picnic.\n";
  } else if (code >= 1003 && code <= 1030) {
    advice += "• 🌥 Some clouds — still a decent day to be outdoors.\n";
  } else if (code >= 1063 && code <= 1201) {
    advice += "• 🌧 Possibility of rain. Carry an umbrella just in case.\n";
  } else if (code >= 1210 && code <= 1225) {
    advice += "• ❄️ Snowfall expected. Dress warmly and be careful on the roads.\n";
  } else if (code >= 1273) {
    advice += "• ⛈ Stormy weather. Better to stay indoors and avoid open spaces.\n";
  }

  // Wind Advice
  if (wind > 30) {
    advice += "• 🌬 Strong winds today. Secure any loose items and avoid cycling.\n";
  } else if (wind > 15) {
    advice += "• 🍃 Moderate breeze. Might feel chilly in open areas.\n";
  }

  return advice;
};

export default weatherService;
