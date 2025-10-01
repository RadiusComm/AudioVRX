import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronRight, Tag, Clock, Users } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';

interface Scenario {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  instructor: {
    name: string;
    avatar: string;
    role: string;
  };
  duration: string;
  participants: number;
  tags: string[];
}

const mockScenarios: Scenario[] = [
  {
    id: '1',
    title: 'Sales 101 roleplay course',
    description: 'Master the fundamentals of sales conversations and objection handling in this comprehensive course.',
    imageUrl: 'https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    instructor: {
      name: 'Sarah Mitchell',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      role: 'Sales Director'
    },
    duration: '2-3 hours',
    participants: 1243,
    tags: ['Sales', 'Beginner', 'Communication']
  },
  {
    id: '2',
    title: 'Advanced Negotiation Techniques',
    description: 'Learn advanced strategies for handling complex negotiations and closing high-value deals.',
    imageUrl: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    instructor: {
      name: 'Michael Chen',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      role: 'Senior Negotiator'
    },
    duration: '4-5 hours',
    participants: 856,
    tags: ['Negotiation', 'Advanced', 'Business']
  },
  {
    id: '3',
    title: 'Customer Service Excellence',
    description: 'Develop essential skills for delivering exceptional customer service and handling difficult situations.',
    imageUrl: 'https://images.pexels.com/photos/7709087/pexels-photo-7709087.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    instructor: {
      name: 'Emily Rodriguez',
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      role: 'Customer Success Manager'
    },
    duration: '3-4 hours',
    participants: 2156,
    tags: ['Customer Service', 'Intermediate', 'Communication']
  },
  {
    id: '4',
    title: 'Leadership Communication',
    description: 'Master the art of leadership communication and team motivation.',
    imageUrl: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    instructor: {
      name: 'David Wilson',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      role: 'Leadership Coach'
    },
    duration: '4-5 hours',
    participants: 1589,
    tags: ['Leadership', 'Advanced', 'Management']
  }
];

export const Explore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredScenarios = mockScenarios.filter(scenario => {
    const matchesSearch = scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => scenario.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(mockScenarios.flatMap(s => s.tags)));

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
              Explore Scenarios
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Discover and practice various conversation scenarios
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search scenarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
                fullWidth
              />
            </div>
            <Button
              variant="outline"
              leftIcon={<Filter className="h-5 w-5" />}
              className="md:w-auto"
            >
              Filter
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  );
                }}
              >
                {tag}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredScenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={scenario.imageUrl}
                        alt={scenario.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {scenario.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {scenario.description}
                      </p>
                      <div className="flex items-center mb-4">
                        <Avatar
                          src={scenario.instructor.avatar}
                          name={scenario.instructor.name}
                          size="sm"
                        />
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {scenario.instructor.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {scenario.instructor.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {scenario.duration}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {scenario.participants.toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {scenario.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};