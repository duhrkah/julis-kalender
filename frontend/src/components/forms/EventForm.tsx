/**
 * Event form component with react-hook-form + zod validation
 */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EventCreate } from '@/types/event';
import { Category } from '@/types/category';
import * as categoryApi from '@/lib/api/categories';

const eventSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(255, 'Titel darf maximal 255 Zeichen lang sein'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Startdatum ist erforderlich'),
  start_time: z.string().optional(),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().max(500, 'Ort darf maximal 500 Zeichen lang sein').optional(),
  location_url: z
    .string()
    .url('Bitte geben Sie eine gültige URL ein')
    .max(500, 'URL darf maximal 500 Zeichen lang sein')
    .optional()
    .or(z.literal('')),
  category_id: z.number().optional(),
  submitter_name: z.string().max(255, 'Name darf maximal 255 Zeichen lang sein').optional(),
  submitter_email: z
    .string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein')
    .optional()
    .or(z.literal('')),
  is_public: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.end_date && data.start_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'Enddatum muss nach dem Startdatum liegen',
    path: ['end_date'],
  }
);

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: Partial<EventCreate>;
  onSubmit: (data: EventCreate) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function EventForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Event einreichen',
}: EventFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      start_date: initialData?.start_date || '',
      start_time: initialData?.start_time || '',
      end_date: initialData?.end_date || '',
      end_time: initialData?.end_time || '',
      location: initialData?.location || '',
      location_url: initialData?.location_url || '',
      category_id: initialData?.category_id || undefined,
      submitter_name: initialData?.submitter_name || '',
      submitter_email: initialData?.submitter_email || '',
      is_public: initialData?.is_public !== undefined ? initialData.is_public : true,
    },
  });

  const startDate = watch('start_date');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryApi.getPublicCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const onFormSubmit = async (data: EventFormData) => {
    setSubmitError(null);

    try {
      const cleanData: EventCreate = {
        title: data.title,
        start_date: data.start_date,
        is_public: data.is_public,
        description: data.description || undefined,
        start_time: data.start_time || undefined,
        end_date: data.end_date || undefined,
        end_time: data.end_time || undefined,
        location: data.location || undefined,
        location_url: data.location_url || undefined,
        submitter_name: data.submitter_name || undefined,
        submitter_email: data.submitter_email || undefined,
        category_id: data.category_id || undefined,
      };

      await onSubmit(cleanData);
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Fehler beim Speichern');
    }
  };

  const inputClassName = (hasError: boolean) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors bg-background ${
      hasError
        ? 'border-red-500 focus:ring-red-500'
        : 'border-border focus:ring-primary'
    }`;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {submitError && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
          {submitError}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('title')}
          className={inputClassName(!!errors.title)}
          placeholder="z.B. JuLis Bundeskongress 2026"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Beschreibung
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className={inputClassName(!!errors.description)}
          placeholder="Beschreiben Sie das Event..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Date/Time Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Startdatum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('start_date')}
            className={inputClassName(!!errors.start_date)}
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-500">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Startzeit
          </label>
          <input
            type="time"
            {...register('start_time')}
            className={inputClassName(!!errors.start_time)}
          />
          {errors.start_time && (
            <p className="mt-1 text-sm text-red-500">{errors.start_time.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Enddatum
          </label>
          <input
            type="date"
            {...register('end_date')}
            min={startDate}
            className={inputClassName(!!errors.end_date)}
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-500">{errors.end_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Endzeit
          </label>
          <input
            type="time"
            {...register('end_time')}
            className={inputClassName(!!errors.end_time)}
          />
          {errors.end_time && (
            <p className="mt-1 text-sm text-red-500">{errors.end_time.message}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Ort
          </label>
          <input
            type="text"
            {...register('location')}
            className={inputClassName(!!errors.location)}
            placeholder="z.B. Berlin Congress Center"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Ort-URL
          </label>
          <input
            type="url"
            {...register('location_url')}
            className={inputClassName(!!errors.location_url)}
            placeholder="https://maps.google.com/..."
          />
          {errors.location_url && (
            <p className="mt-1 text-sm text-red-500">{errors.location_url.message}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Kategorie
        </label>
        <select
          {...register('category_id', {
            setValueAs: (v) => (v === '' ? undefined : Number(v)),
          })}
          className={inputClassName(!!errors.category_id)}
        >
          <option value="">Keine Kategorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="mt-1 text-sm text-red-500">{errors.category_id.message}</p>
        )}
      </div>

      {/* Submitter Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Ihr Name <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            type="text"
            {...register('submitter_name')}
            className={inputClassName(!!errors.submitter_name)}
            placeholder="Wird verwendet, falls abweichend vom Account"
          />
          {errors.submitter_name && (
            <p className="mt-1 text-sm text-red-500">{errors.submitter_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Ihre E-Mail <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            type="email"
            {...register('submitter_email')}
            className={inputClassName(!!errors.submitter_email)}
            placeholder="Wird verwendet, falls abweichend vom Account"
          />
          {errors.submitter_email && (
            <p className="mt-1 text-sm text-red-500">{errors.submitter_email.message}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Wird gespeichert...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
