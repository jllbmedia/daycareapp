'use client';

import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CheckInRecord } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface EditAttendanceModalProps {
  record: CheckInRecord;
  onClose: () => void;
  onUpdate: (updatedRecord: CheckInRecord) => void;
}

export function EditAttendanceModal({ record, onClose, onUpdate }: EditAttendanceModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dropOffInfo: {
      personName: record.dropOffInfo?.personName || '',
      relationship: record.dropOffInfo?.relationship || '',
      signature: record.dropOffInfo?.signature || '',
      notes: record.dropOffInfo?.notes || '',
    },
    pickUpInfo: record.pickUpInfo ? {
      personName: record.pickUpInfo.personName || '',
      relationship: record.pickUpInfo.relationship || '',
      signature: record.pickUpInfo.signature || '',
      notes: record.pickUpInfo.notes || '',
      time: record.pickUpInfo.time,
    } : undefined,
    healthStatus: {
      hasFever: record.healthStatus?.hasFever || false,
      temperature: record.healthStatus?.temperature || null,
      symptoms: record.healthStatus?.symptoms?.join(', ') || '',
      medications: record.healthStatus?.medications?.join(', ') || '',
    },
    meals: {
      breakfast: record.meals?.breakfast || false,
      lunch: record.meals?.lunch || false,
      snack: record.meals?.snack || false,
    },
    concerns: record.concerns || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const updateData = {
        dropOffInfo: formData.dropOffInfo,
        pickUpInfo: formData.pickUpInfo,
        healthStatus: {
          ...formData.healthStatus,
          symptoms: formData.healthStatus.symptoms.split(',').map(s => s.trim()).filter(Boolean),
          medications: formData.healthStatus.medications.split(',').map(m => m.trim()).filter(Boolean),
        },
        meals: formData.meals,
        concerns: formData.concerns || null,
        updatedAt: Timestamp.now(),
        updatedBy: user?.uid,
      };

      await updateDoc(doc(db, 'checkIns', record.id), updateData);
      toast.success('Attendance record updated successfully');
      onUpdate({
        ...record,
        ...updateData,
        pickUpInfo: updateData.pickUpInfo || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error updating attendance record:', err);
      toast.error('Failed to update attendance record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit Attendance Record</h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Drop-off Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Drop-off Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Person Name</label>
                <input
                  type="text"
                  value={formData.dropOffInfo.personName}
                  onChange={(e) => setFormData({
                    ...formData,
                    dropOffInfo: { ...formData.dropOffInfo, personName: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                <input
                  type="text"
                  value={formData.dropOffInfo.relationship}
                  onChange={(e) => setFormData({
                    ...formData,
                    dropOffInfo: { ...formData.dropOffInfo, relationship: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Health Status</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.healthStatus.hasFever}
                  onChange={(e) => setFormData({
                    ...formData,
                    healthStatus: { ...formData.healthStatus, hasFever: e.target.checked }
                  })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Has Fever</label>
              </div>
              {formData.healthStatus.hasFever && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.healthStatus.temperature || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      healthStatus: { ...formData.healthStatus, temperature: parseFloat(e.target.value) }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Symptoms</label>
              <input
                type="text"
                value={formData.healthStatus.symptoms}
                onChange={(e) => setFormData({
                  ...formData,
                  healthStatus: { ...formData.healthStatus, symptoms: e.target.value }
                })}
                placeholder="Comma-separated symptoms"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Meals</h4>
            <div className="space-y-2">
              {Object.entries(formData.meals).map(([meal, value]) => (
                <div key={meal} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      meals: { ...formData.meals, [meal]: e.target.checked }
                    })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 capitalize">
                    {meal}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Concerns */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Concerns</label>
            <textarea
              value={formData.concerns}
              onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 