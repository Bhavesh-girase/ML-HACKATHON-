import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/solar-hero.jpg";
import { Sun, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="relative">
        <div
          className="h-screen bg-cover bg-center bg-no-repeat relative"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center max-w-4xl mx-auto px-6">
              <div className="flex justify-center mb-6">
                <Sun className="h-28 w-28 text-yellow-400 animate-pulse drop-shadow-lg" />
              </div>
              <motion.h1
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-9xl  font-extrabold mb-6 text-white drop-shadow-xl"
              >
                Sunwise
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-2xl  mb-8 text-gray-300 max-w-2xl mx-auto leading-relaxed"
              >
                Predict your solar power generation based on location and custom panel configuration using live location and weather data
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <Button
                  variant="solar"
                  size="lg"
                  onClick={() => navigate("/location")}
                  className="text-lg px-8 py-4 h-auto bg-green-500 hover:bg-green-600 text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl rounded-full"
                >
                  <Zap className="mr-2 h-5 w-5 text-green-400 animate-bounce" />
                  Get Started
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                Icon: Globe,
                title: "Location Setup",
                desc: "Enter your city or use live GPS location to get precise solar data for your area",
              },
              {
                Icon: Zap,
                title: "Panel Configuration",
                desc: "Customize your solar system with panel wattage",
              },
              {
                Icon: Sun,
                title: "Model Predictions",
                desc: "Get personalized power generation forecasts using weather data and Model analysis",
              },
            ].map(({ Icon, title, desc }, i) => (
              <motion.div
                key={i}
                className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: i * 0.2 }}
              >
                <Icon className="h-12 w-12 text-green-400 mx-auto mb-4 drop-shadow-sm" />
                <h3 className="text-2xl font-semibold mb-4 text-white">{title}</h3>
                <p className="text-gray-400 text-base leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
