import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Target, CheckCircle, GitBranch, UserCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RolePlayType } from '../../types/roleplay';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/ui/Avatar';
import { Persona } from '../../types';

interface UserIntent {
  id: string;
  name: string;
  examples: string[];
  responses: string[];
}

interface ConversationBranch {
  id: string;
  trigger: string;
  response: string;
  nextBranches?: string[];
}

export const CreateScenario = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: RolePlayType.DISCOVERY_CALL,
    difficulty: 'intermediate',
    objectives: [''],
    successCriteria: [''],
    intents: [{ id: '1', name: '', examples: [''], responses: [''] }] as UserIntent[],
    branches: [{ id: '1', trigger: '', response: '', nextBranches: [] }] as ConversationBranch[],
    isPublic: false,
    personaId: '',
  });

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('iq_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonas(data || []);
    } catch (err) {
      console.error('Error loading personas:', err);
      setError('Failed to load IQ agents');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => i === index ? value : obj)
    }));
  };

  const handleSuccessCriteriaChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      successCriteria: prev.successCriteria.map((crit, i) => i === index ? value : crit)
    }));
  };

  const handleIntentChange = (index: number, field: keyof UserIntent, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      intents: prev.intents.map((intent, i) => {
        if (i === index) {
          return { ...intent, [field]: value };
        }
        return intent;
      })
    }));
  };

  const handleBranchChange = (index: number, field: keyof ConversationBranch, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.map((branch, i) => {
        if (i === index) {
          return { ...branch, [field]: value };
        }
        return branch;
      })
    }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const addSuccessCriteria = () => {
    setFormData(prev => ({
      ...prev,
      successCriteria: [...prev.successCriteria, '']
    }));
  };

  const removeSuccessCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      successCriteria: prev.successCriteria.filter((_, i) => i !== index)
    }));
  };

  const addIntent = () => {
    setFormData(prev => ({
      ...prev,
      intents: [...prev.intents, { id: Date.now().toString(), name: '', examples: [''], responses: [''] }]
    }));
  };

  const removeIntent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      intents: prev.intents.filter((_, i) => i !== index)
    }));
  };

  const addBranch = () => {
    setFormData(prev => ({
      ...prev,
      branches: [...prev.branches, { id: Date.now().toString(), trigger: '', response: '', nextBranches: [] }]
    }));
  };

  const removeBranch = (index: number) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('roleplay_scenarios').insert([{
        title: formData.title,
        description: formData.description,
        type: formData.type,
        difficulty: formData.difficulty,
        objectives: formData.objectives.filter(obj => obj.trim() !== ''),
        success_criteria: formData.successCriteria.filter(crit => crit.trim() !== ''),
        intents: formData.intents.filter(intent => intent.name.trim() !== ''),
        branches: formData.branches.filter(branch => branch.trigger.trim() !== ''),
        is_public: formData.isPublic,
        created_by: user.id,
        persona_id: formData.personaId || null,
      }]);

      if (error) throw error;
      navigate('/roleplay');
    } catch (err: any) {
      console.error('Error creating scenario:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPersona = personas.find(p => p.id === formData.personaId);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <motion.div 
          className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="mr-4"
              onClick={() => navigate('/roleplay')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                Create Role Play Scenario
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Design a custom conversation scenario for training
              </p>
            </div>
          </div>

          <Card className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Scenario Details</CardTitle>
                <CardDescription>
                  Define the parameters and flow of your role play scenario
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <div className="p-3 bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-error-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a descriptive title"
                    required
                    fullWidth
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Describe the role-play and its goals"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        required
                      >
                        {Object.values(RolePlayType).map((type) => (
                          <option key={type} value={type}>
                            {type.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Difficulty
                      </label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        required
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <UserCircle className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                        Select Persona
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        name="personaId"
                        value={formData.personaId}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="">Select a persona</option>
                        {personas.map((persona) => (
                          <option key={persona.id} value={persona.id}>
                            {persona.name} - {persona.role}
                          </option>
                        ))}
                      </select>

                      {selectedPersona && (
                        <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                          <Avatar
                            src={selectedPersona.avatar_url}
                            name={selectedPersona.name}
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedPersona.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {selectedPersona.role}
                              {selectedPersona.company && ` at ${selectedPersona.company}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Target className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                        Objectives
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addObjective}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add Objective
                      </Button>
                    </div>
                    {formData.objectives.map((objective, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={objective}
                          onChange={(e) => handleObjectiveChange(index, e.target.value)}
                          placeholder={`Objective ${index + 1}`}
                          fullWidth
                        />
                        {formData.objectives.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjective(index)}
                          >
                            <Trash2 className="h-4 w-4 text-error-600 dark:text-error-400" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                        Success Criteria
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSuccessCriteria}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add Criteria
                      </Button>
                    </div>
                    {formData.successCriteria.map((criteria, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={criteria}
                          onChange={(e) => handleSuccessCriteriaChange(index, e.target.value)}
                          placeholder={`Success Criteria ${index + 1}`}
                          fullWidth
                        />
                        {formData.successCriteria.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSuccessCriteria(index)}
                          >
                            <Trash2 className="h-4 w-4 text-error-600 dark:text-error-400" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        User Intents
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIntent}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add Intent
                      </Button>
                    </div>
                    {formData.intents.map((intent, index) => (
                      <Card key={intent.id} className="bg-gray-50 dark:bg-gray-700/50">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <Input
                              label="Intent Name"
                              value={intent.name}
                              onChange={(e) => handleIntentChange(index, 'name', e.target.value)}
                              placeholder="e.g., Ask about pricing"
                              fullWidth
                            />
                            {formData.intents.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeIntent(index)}
                                className="ml-2"
                              >
                                <Trash2 className="h-4 w-4 text-error-600 dark:text-error-400" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Example Phrases
                            </label>
                            {intent.examples.map((example, exIndex) => (
                              <Input
                                key={exIndex}
                                value={example}
                                onChange={(e) => {
                                  const newExamples = [...intent.examples];
                                  newExamples[exIndex] = e.target.value;
                                  handleIntentChange(index, 'examples', newExamples);
                                }}
                                placeholder={`Example ${exIndex + 1}`}
                                fullWidth
                              />
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newExamples = [...intent.examples, ''];
                                handleIntentChange(index, 'examples', newExamples);
                              }}
                              leftIcon={<Plus className="h-4 w-4" />}
                            >
                              Add Example
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <GitBranch className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                        Conversation Branches
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addBranch}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add Branch
                      </Button>
                    </div>
                    {formData.branches.map((branch, index) => (
                      <Card key={branch.id} className="bg-gray-50 dark:bg-gray-700/50">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Branch {index + 1}
                            </h4>
                            {formData.branches.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBranch(index)}
                              >
                                <Trash2 className="h-4 w-4 text-error-600 dark:text-error-400" />
                              </Button>
                            )}
                          </div>
                          <Input
                            label="Trigger Phrase"
                            value={branch.trigger}
                            onChange={(e) => handleBranchChange(index, 'trigger', e.target.value)}
                            placeholder="When user says..."
                            fullWidth
                          />
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Response
                            </label>
                            <textarea
                              value={branch.response}
                              onChange={(e) => handleBranchChange(index, 'response', e.target.value)}
                              rows={3}
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="AI response..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Make this role-play public
                    </label>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/roleplay')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                >
                  Create Role-Play
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};