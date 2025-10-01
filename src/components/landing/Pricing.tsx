import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';

const pricingPlans = [
  {
    name: 'Starter',
    price: 0,
    period: 'month',
    description: 'Perfect for individuals getting started',
    features: [
      '5 practice role-plays',
      'Basic analytics',
      'Email support',
      'Community access',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Professional',
    price: 49,
    period: 'month',
    description: 'Ideal for growing teams and businesses',
    features: [
      'Unlimited role-plays',
      'Advanced analytics',
      'Priority support',
      'Custom role-play',
      'Team management',
      'API access',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: null,
    period: 'month',
    description: 'Custom solutions for large organizations',
    features: [
      'Custom deployment',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'Advanced security',
      'Custom reporting',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const Pricing = () => {
  const navigate = useNavigate();

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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800" id="pricing">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Choose the plan that's right for you
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          {pricingPlans.map((plan, index) => (
            <motion.div 
              key={index} 
              className="relative pt-4 flex"
              variants={itemVariants}
            >
              {plan.popular && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <div className="inline-flex items-center gap-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}
              <Card 
                className={`flex flex-col w-full transform hover:scale-105 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-primary-500 dark:border-primary-400 shadow-xl hover:shadow-2xl' 
                    : 'hover:shadow-xl'
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    {plan.price !== null ? (
                      <div className="flex items-baseline">
                        <span className="text-5xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">/{plan.period}</span>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">Custom</div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-primary-500 dark:text-primary-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    fullWidth
                    size="lg"
                    className="text-lg py-6"
                    onClick={() => navigate('/signup')}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};