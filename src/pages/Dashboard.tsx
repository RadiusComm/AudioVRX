import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Features } from '../components/landing/Features';
import { Testimonials } from '../components/landing/Testimonials';
import { CallToAction } from '../components/landing/CallToAction';
import { supabase } from '../lib/supabase';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  useEffect(() => {
    checkUserRole();
  }, []);
  
  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error || !profile) {
        console.error('Error fetching user profile or profile not found:', error);
        // Redirect to sign in if profile doesn't exist
        navigate('/signin');
        return;
      }
      
      setIsAdmin(profile.role === 'admin');
      setIsSuperAdmin(profile.role === 'super-admin');
    
      navigate('/analytics');
    } catch (err) {
      console.error('Error checking user role:', err);
    }
  };

  return (
    <Layout>
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CallToAction />
    </Layout>
  );
};