'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  title: z.string().min(3),
  agency: z.string().min(2),
  problem: z.string().min(30),
  solution: z.string().min(30),
  team: z.string().min(10),
  commercialization: z.string().min(30),
});

type FormValues = z.infer<typeof schema>;

export default function IntakePage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormValues) => {
    // For MVP: store in localStorage; in real app you'd POST to /api/intake
    localStorage.setItem('lastIntake', JSON.stringify(data));
    alert('Saved intake. Go to Dashboard.');
    window.location.href = '/dashboard';
  };

  return (
    <div className="mt-8 card">
      <h2 className="text-xl font-semibold mb-4">New Project Intake</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
        <label>Title<input className="w-full p-2 rounded bg-[#0c0e14] border border-[#1f2430]" {...register('title')} /></label>
        <label>Agency<input className="w-full p-2 rounded bg-[#0c0e14] border border-[#1f2430]" {...register('agency')} /></label>
        <label>Problem<textarea className="w-full p-2 rounded bg-[#0c0e14] border border-[#1f2430]" rows={4} {...register('problem')} /></label>
        <label>Solution<textarea className="w-full p-2 rounded bg-[#0c0e14] border border-[#1f2430]" rows={4} {...register('solution')} /></label>
        <label>Team<textarea className="w-full p-2 rounded bg-[#0c0e14] border border-[#1f2430]" rows={3} {...register('team')} /></label>
        <label>Commercialization<textarea className="w-full p-2 rounded bg-[#0c0e14] border border-[#1f2430]" rows={3} {...register('commercialization')} /></label>
        {Object.values(errors).length > 0 && <p className="text-red-400">Please complete all fields.</p>}
        <button disabled={isSubmitting} className="btn w-fit" type="submit">Save & Continue</button>
      </form>
    </div>
  );
}
