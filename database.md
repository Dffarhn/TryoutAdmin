-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  user_id uuid,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  description text,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT admin_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT admin_activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);
CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text,
  email text,
  is_super_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.answer_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  text text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT answer_options_pkey PRIMARY KEY (id),
  CONSTRAINT answer_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT packages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.question_sub_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  sub_chapter_id uuid NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT question_sub_chapters_pkey PRIMARY KEY (id),
  CONSTRAINT question_sub_chapters_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT question_sub_chapters_sub_chapter_id_fkey FOREIGN KEY (sub_chapter_id) REFERENCES public.sub_chapters(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tryout_id uuid,
  nomor integer,
  text text NOT NULL,
  explanation text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  correct_answer_option_id uuid,
  link text,
  category_id uuid,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_tryout_id_fkey FOREIGN KEY (tryout_id) REFERENCES public.tryouts(id),
  CONSTRAINT fk_questions_correct_option FOREIGN KEY (correct_answer_option_id) REFERENCES public.answer_options(id),
  CONSTRAINT questions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.sub_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tryout_id uuid NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  category_id uuid NOT NULL,
  CONSTRAINT sub_chapters_pkey PRIMARY KEY (id),
  CONSTRAINT sub_chapters_tryout_id_fkey FOREIGN KEY (tryout_id) REFERENCES public.tryouts(id),
  CONSTRAINT sub_chapters_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.subscription_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  features jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscription_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_type_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending'::text,
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT transactions_subscription_type_id_fkey FOREIGN KEY (subscription_type_id) REFERENCES public.subscription_types(id)
);
CREATE TABLE public.tryout_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tryout_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  duration_minutes integer,
  total_questions integer,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  unanswered_count integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tryout_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT tryout_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT tryout_attempts_tryout_id_fkey FOREIGN KEY (tryout_id) REFERENCES public.tryouts(id)
);
CREATE TABLE public.tryout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL,
  subscription_type_id uuid NOT NULL,
  available_until timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tryout_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT tryout_sessions_subscription_type_id_fkey FOREIGN KEY (subscription_type_id) REFERENCES public.subscription_types(id),
  CONSTRAINT tryout_sessions_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id)
);
CREATE TABLE public.tryouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tryouts_pkey PRIMARY KEY (id),
  CONSTRAINT tryouts_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id)
);
CREATE TABLE public.user_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer_option_id uuid,
  is_correct boolean,
  answered_at timestamp with time zone NOT NULL DEFAULT now(),
  sub_chapter_id uuid,
  CONSTRAINT user_answers_pkey PRIMARY KEY (id),
  CONSTRAINT user_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.tryout_attempts(id),
  CONSTRAINT user_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT user_answers_answer_option_id_fkey FOREIGN KEY (answer_option_id) REFERENCES public.answer_options(id),
  CONSTRAINT user_answers_sub_chapter_id_fkey FOREIGN KEY (sub_chapter_id) REFERENCES public.sub_chapters(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  photo_url text,
  total_xp integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_type_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT user_subscriptions_subscription_type_id_fkey FOREIGN KEY (subscription_type_id) REFERENCES public.subscription_types(id),
  CONSTRAINT user_subscriptions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);