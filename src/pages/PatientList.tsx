import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest } from '../lib/api';
import { Layout } from '../components/Layout';
import { SearchBar } from '../components/SearchBar';
import { PatientCard } from '../components/PatientCard';
import { useAuth } from '../lib/auth';
import { formatHN, isValidHN, cleanHN } from '../lib/hn';
import { Plus, X, Search, Calendar, User, Phone, ClipboardPlus, Loader } from 'lucide-react';
import { Patient } from '../types';

const patientSchema = z.object({
  hn: z.string().refine(val => isValidHN(val), 'Invalid HN. Format must be 07-XX-XXXXXX (10 digits starting with 07).'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  blood_group: z.string().min(1, 'Blood group is required'),
  phone: z.string().min(1, 'Phone is required'),
  line_id: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  emergency_contact: z.string().min(1, 'Emergency contact is required'),
  primary_physician: z.string().min(1, 'Primary physician is required'),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface ListPatientsResponse {
  success: boolean;
  patients: Patient[];
}

export const PatientList: React.FC = () => {
  const queryClient = useQueryClient();
  const { isDoctorOrNurse } = useAuth();
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch patient list
  const { data, isLoading, error } = useQuery<ListPatientsResponse>({
    queryKey: ['patients', searchQuery, diagnosisFilter],
    queryFn: () => apiRequest<ListPatientsResponse>('patients.list', 'GET', {
      search: searchQuery,
      diagnosis: diagnosisFilter
    }),
    refetchInterval: 30000, // 30s cache refresh
  });

  // Patient registration mutation
  const createPatientMutation = useMutation({
    mutationFn: (values: PatientFormValues) => 
      apiRequest<{ success: boolean; id: string }>('patients.create', 'POST', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsModalOpen(false);
      reset();
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to register patient. Please check credentials or duplicates.');
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      hn: '',
      first_name: '',
      last_name: '',
      dob: '',
      gender: 'Male',
      blood_group: 'A Rh+',
      phone: '',
      line_id: '',
      address: '',
      emergency_contact: '',
      primary_physician: '',
    }
  });

  const handleHNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const clean = cleanHN(rawVal);
    // Format only if typing digits
    if (clean.length <= 10) {
      setValue('hn', formatHN(clean), { shouldValidate: true });
    }
  };

  const onSubmit = (values: PatientFormValues) => {
    createPatientMutation.mutate(values);
  };

  return (
    <Layout currentRoute="patients">
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl text-slate-800">Patient Registry</h2>
            <p className="text-slate-500 text-xs mt-1">Search, filter, and register clinic patients</p>
          </div>
          {isDoctorOrNurse && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-hospital-600 hover:bg-hospital-700 text-white font-bold py-2.5 px-5 rounded-lg text-xs transition-colors shadow self-start"
            >
              <Plus className="h-4 w-4" />
              Register New Patient
            </button>
          )}
        </div>

        {/* Search controls */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          diagnosisFilter={diagnosisFilter}
          onDiagnosisChange={setDiagnosisFilter}
        />

        {/* Patient listings grid / table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader className="h-8 w-8 text-hospital-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-550 p-4 rounded-xl text-xs text-red-800 font-semibold leading-relaxed">
            Failed to retrieve registry records. Please verify API connection script is running.
          </div>
        ) : data?.patients && data.patients.length > 0 ? (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3.5">HN</th>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Gender</th>
                    <th className="px-6 py-3.5">DOB</th>
                    <th className="px-6 py-3.5">Phone</th>
                    <th className="px-6 py-3.5">Primary Physician</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.patients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-hospital-800">{pat.hn}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{pat.first_name} {pat.last_name}</td>
                      <td className="px-6 py-3.5 capitalize">{pat.gender}</td>
                      <td className="px-6 py-3.5 text-slate-500">{pat.dob}</td>
                      <td className="px-6 py-3.5 text-slate-500">{pat.phone}</td>
                      <td className="px-6 py-3.5 font-medium">{pat.primary_physician || '-'}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => window.location.hash = `#/patients/${pat.id}`}
                          className="text-hospital-600 hover:text-hospital-800 font-bold hover:underline"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
              {data.patients.map((pat) => (
                <PatientCard 
                  key={pat.id} 
                  patient={pat} 
                  activeDiagnosesNames={[]} // Handled in detail fetch
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl p-8 text-center text-slate-400 text-sm">
            No patients match your search query.
          </div>
        )}

        {/* Register Patient Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-8">
              {/* Modal Header */}
              <div className="bg-hospital-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardPlus className="h-5 w-5 text-hospital-300" />
                  <span className="font-bold text-sm">Register New Patient Record</span>
                </div>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg('');
                  }}
                  className="text-hospital-300 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                {errorMsg && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800 font-semibold mb-2">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* HN Input with formatting on keypress */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Hospital Number (HN) *</label>
                    <input
                      type="text"
                      {...register('hn')}
                      onChange={handleHNChange}
                      placeholder="07-XX-XXXXXX"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none uppercase font-mono font-semibold"
                    />
                    {errors.hn ? (
                      <span className="text-[10px] text-red-500 block mt-1">{errors.hn.message}</span>
                    ) : (
                      <span className="text-[9px] text-slate-400 block mt-1">E.g., 0712345678 or 07-12-345678</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Primary Physician *</label>
                    <input
                      type="text"
                      {...register('primary_physician')}
                      placeholder="Dr. Theerayut"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    />
                    {errors.primary_physician && (
                      <span className="text-[10px] text-red-500 block mt-1">{errors.primary_physician.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">First Name *</label>
                    <input
                      type="text"
                      {...register('first_name')}
                      placeholder="e.g. Chua"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    />
                    {errors.first_name && (
                      <span className="text-[10px] text-red-500 block mt-1">{errors.first_name.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name *</label>
                    <input
                      type="text"
                      {...register('last_name')}
                      placeholder="e.g. Bee Poh"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    />
                    {errors.last_name && (
                      <span className="text-[10px] text-red-500 block mt-1">{errors.last_name.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      {...register('dob')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    />
                    {errors.dob && (
                      <span className="text-[10px] text-red-500 block mt-1">{errors.dob.message}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Gender *</label>
                      <select
                        {...register('gender')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Blood Group *</label>
                      <select
                        {...register('blood_group')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                      >
                        <option value="A Rh+">A Rh+</option>
                        <option value="A Rh-">A Rh-</option>
                        <option value="B Rh+">B Rh+</option>
                        <option value="B Rh-">B Rh-</option>
                        <option value="AB Rh+">AB Rh+</option>
                        <option value="AB Rh-">AB Rh-</option>
                        <option value="O Rh+">O Rh+</option>
                        <option value="O Rh-">O Rh-</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      {...register('phone')}
                      placeholder="e.g. 087-2914848"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    />
                    {errors.phone && (
                      <span className="text-[10px] text-red-500 block mt-1">{errors.phone.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">LINE ID</label>
                    <input
                      type="text"
                      {...register('line_id')}
                      placeholder="e.g. chuabeepoh"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Address *</label>
                  <textarea
                    rows={2}
                    {...register('address')}
                    placeholder="Residential address details..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none resize-none"
                  />
                  {errors.address && (
                    <span className="text-[10px] text-red-500 block mt-1">{errors.address.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Emergency Contact Details *</label>
                  <input
                    type="text"
                    {...register('emergency_contact')}
                    placeholder="Name, Phone (e.g. Son: 081-XXXXXXX)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                  />
                  {errors.emergency_contact && (
                    <span className="text-[10px] text-red-500 block mt-1">{errors.emergency_contact.message}</span>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPatientMutation.isPending}
                    className="bg-hospital-600 hover:bg-hospital-700 disabled:bg-slate-300 text-white font-bold py-2 px-5 rounded-lg text-xs transition-colors shadow"
                  >
                    {createPatientMutation.isPending ? 'Registering...' : 'Register Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
