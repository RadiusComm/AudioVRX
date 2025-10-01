import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

const testimonials = [
  {
    quote: "This platform has transformed how we train our customer service team. The realistic scenarios and instant feedback have significantly improved our team's performance.",
    author: "Sarah Johnson",
    role: "Customer Service Director",
    company: "TechCorp Inc.",
    rating: 5,
    avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    quote: "The analytics and insights provided have helped us identify areas for improvement and track progress effectively. It's been a game-changer for our training program.",
    author: "Michael Chen",
    role: "Training Manager",
    company: "Global Solutions Ltd.",
    rating: 5,
    avatarUrl: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    quote: "The customizable scenarios and enterprise features have made it easy to scale our training across multiple departments. The ROI has been exceptional.",
    author: "Emily Rodriguez",
    role: "Head of Sales",
    company: "Innovate Corp",
    rating: 5,
    avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
];

export const Testimonials = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 overflow-hidden">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div className="text-center mb-8 sm:mb-12 lg:mb-16" variants={itemVariants}>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Loved by Teams Worldwide
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 px-4">
            See what our customers have to say
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          variants={containerVariants}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="h-full"
            >
              <Card className="h-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center mb-6">
                    <Quote className="w-8 sm:w-10 h-8 sm:h-10 text-primary-500 dark:text-primary-400" />
                  </div>
                  <div className="flex mb-4 sm:mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg mb-4 sm:mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatarUrl}
                      alt={testimonial.author}
                      className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-cover"
                    />
                    <div className="ml-3 sm:ml-4">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {testimonial.author}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};