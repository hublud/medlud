import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { UploadCloud, FileText, ArrowLeft, Loader2 } from 'lucide-react';

interface NewCaseFormProps {
    onCancel: () => void;
    onSubmit: (caseData: { title: string; description: string; attachment_url?: string; newCaseId: string }) => void;
    specialtyType?: string;
}

export const NewCaseForm: React.FC<NewCaseFormProps> = ({ onCancel, onSubmit, specialtyType }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setError('Please provide a title and description for your case.');
            return;
        }

        try {
            setUploading(true);
            setError('');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let attachment_url = '';

            // Handle file upload if present
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('medical_records') // ensure this bucket exists or use any generic bucket
                    .upload(filePath, file);

                if (uploadError) {
                    // Ignore bucket error locally for demo, just null it out, or try a different bucket
                    console.log('Upload error (bucket might not exist):', uploadError);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('medical_records')
                        .getPublicUrl(filePath);
                    attachment_url = publicUrl;
                }
            }

            // Create case
            const { data: caseResult, error: caseError } = await supabase
                .from('telemedicine_cases')
                .insert([{
                    patient_id: user.id,
                    title: title.trim(),
                    description: description.trim(),
                    attachment_url: attachment_url || null,
                    specialty_type: specialtyType || null,
                    status: 'active'
                }])
                .select()
                .single();

            if (caseError) throw caseError;

            // Proceed
            onSubmit({ title, description, attachment_url, newCaseId: caseResult.id });

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create case');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto text-left animate-in fade-in duration-300 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-border">
            <button onClick={onCancel} className="flex items-center text-text-secondary hover:text-primary mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-2" />
                Back
            </button>

            <h2 className="text-2xl font-bold mb-2">Start New Consultation Case</h2>
            <p className="text-text-secondary mb-6">Describe your symptoms or reason for consultation so the doctor can prepare.</p>

            {error && <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Case Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="E.g., Severe headache for 3 days"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Symptoms & Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please freely describe how you are feeling..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        required
                    ></textarea>
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Attachments (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center">
                            {file ? (
                                <>
                                    <FileText className="text-primary mb-2" size={32} />
                                    <span className="text-sm font-medium text-emerald-600 truncate max-w-xs">{file.name}</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="text-gray-400 mb-2" size={32} />
                                    <span className="text-sm text-text-secondary">Click to upload images or lab results</span>
                                    <span className="text-xs text-text-tertiary mt-1">JPEG, PNG, PDF up to 10MB</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20" disabled={uploading}>
                        {uploading ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={20} />
                                Creating Case...
                            </>
                        ) : (
                            'Continue to Consultation'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
