--
-- PostgreSQL database dump
--

\restrict 0Gp7z6mxkgzQHZY0sTY48GqxVOHRDjHegntaq1wb6NhvSJBlRdcc0412CSb8r0M

-- Dumped from database version 16.10 (Homebrew)
-- Dumped by pg_dump version 16.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO clinic_user;

--
-- Name: chief_complaints_master; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.chief_complaints_master (
    id integer NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chief_complaints_master OWNER TO clinic_user;

--
-- Name: chief_complaints_master_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.chief_complaints_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chief_complaints_master_id_seq OWNER TO clinic_user;

--
-- Name: chief_complaints_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.chief_complaints_master_id_seq OWNED BY public.chief_complaints_master.id;


--
-- Name: diagnosis_master; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.diagnosis_master (
    id integer NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.diagnosis_master OWNER TO clinic_user;

--
-- Name: diagnosis_master_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.diagnosis_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.diagnosis_master_id_seq OWNER TO clinic_user;

--
-- Name: diagnosis_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.diagnosis_master_id_seq OWNED BY public.diagnosis_master.id;


--
-- Name: doctor_advice_master; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.doctor_advice_master (
    id integer NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.doctor_advice_master OWNER TO clinic_user;

--
-- Name: doctor_advice_master_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.doctor_advice_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_advice_master_id_seq OWNER TO clinic_user;

--
-- Name: doctor_advice_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.doctor_advice_master_id_seq OWNED BY public.doctor_advice_master.id;


--
-- Name: lab_tests_master; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.lab_tests_master (
    id integer NOT NULL,
    name character varying NOT NULL,
    test_type character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lab_tests_master OWNER TO clinic_user;

--
-- Name: lab_tests_master_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.lab_tests_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lab_tests_master_id_seq OWNER TO clinic_user;

--
-- Name: lab_tests_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.lab_tests_master_id_seq OWNED BY public.lab_tests_master.id;


--
-- Name: medicine_brands; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.medicine_brands (
    id integer NOT NULL,
    drug_id integer NOT NULL,
    type_id integer,
    name character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.medicine_brands OWNER TO clinic_user;

--
-- Name: medicine_brands_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.medicine_brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicine_brands_id_seq OWNER TO clinic_user;

--
-- Name: medicine_brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.medicine_brands_id_seq OWNED BY public.medicine_brands.id;


--
-- Name: medicine_dosages; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.medicine_dosages (
    id integer NOT NULL,
    brand_id integer NOT NULL,
    label character varying NOT NULL,
    default_instruction character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.medicine_dosages OWNER TO clinic_user;

--
-- Name: medicine_dosages_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.medicine_dosages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicine_dosages_id_seq OWNER TO clinic_user;

--
-- Name: medicine_dosages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.medicine_dosages_id_seq OWNED BY public.medicine_dosages.id;


--
-- Name: medicine_drugs; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.medicine_drugs (
    id integer NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.medicine_drugs OWNER TO clinic_user;

--
-- Name: medicine_drugs_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.medicine_drugs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicine_drugs_id_seq OWNER TO clinic_user;

--
-- Name: medicine_drugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.medicine_drugs_id_seq OWNED BY public.medicine_drugs.id;


--
-- Name: medicine_types; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.medicine_types (
    id integer NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.medicine_types OWNER TO clinic_user;

--
-- Name: medicine_types_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.medicine_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicine_types_id_seq OWNER TO clinic_user;

--
-- Name: medicine_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.medicine_types_id_seq OWNED BY public.medicine_types.id;


--
-- Name: patient_allergy_history; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.patient_allergy_history (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    value text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.patient_allergy_history OWNER TO clinic_user;

--
-- Name: patient_allergy_history_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.patient_allergy_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_allergy_history_id_seq OWNER TO clinic_user;

--
-- Name: patient_allergy_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.patient_allergy_history_id_seq OWNED BY public.patient_allergy_history.id;


--
-- Name: patient_family_history; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.patient_family_history (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    value text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.patient_family_history OWNER TO clinic_user;

--
-- Name: patient_family_history_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.patient_family_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_family_history_id_seq OWNER TO clinic_user;

--
-- Name: patient_family_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.patient_family_history_id_seq OWNED BY public.patient_family_history.id;


--
-- Name: patient_past_history; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.patient_past_history (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    value text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.patient_past_history OWNER TO clinic_user;

--
-- Name: patient_past_history_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.patient_past_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_past_history_id_seq OWNER TO clinic_user;

--
-- Name: patient_past_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.patient_past_history_id_seq OWNED BY public.patient_past_history.id;


--
-- Name: patient_surgical_history; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.patient_surgical_history (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    value text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.patient_surgical_history OWNER TO clinic_user;

--
-- Name: patient_surgical_history_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.patient_surgical_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_surgical_history_id_seq OWNER TO clinic_user;

--
-- Name: patient_surgical_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.patient_surgical_history_id_seq OWNED BY public.patient_surgical_history.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    name character varying NOT NULL,
    phone character varying NOT NULL,
    age integer,
    gender character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    guardian_name character varying,
    address text,
    district character varying,
    age_years integer,
    age_months integer
);


ALTER TABLE public.patients OWNER TO clinic_user;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_id_seq OWNER TO clinic_user;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: prescription_drugs; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.prescription_drugs (
    id integer NOT NULL,
    prescription_id integer NOT NULL,
    drug_name character varying NOT NULL,
    dosage character varying NOT NULL,
    frequency character varying NOT NULL,
    start_date date NOT NULL,
    number_of_days integer NOT NULL,
    end_date date NOT NULL,
    quantity integer NOT NULL,
    instructions text
);


ALTER TABLE public.prescription_drugs OWNER TO clinic_user;

--
-- Name: prescription_drugs_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.prescription_drugs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescription_drugs_id_seq OWNER TO clinic_user;

--
-- Name: prescription_drugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.prescription_drugs_id_seq OWNED BY public.prescription_drugs.id;


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.prescriptions (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    doctor_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    printed_at timestamp with time zone
);


ALTER TABLE public.prescriptions OWNER TO clinic_user;

--
-- Name: prescriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.prescriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescriptions_id_seq OWNER TO clinic_user;

--
-- Name: prescriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.prescriptions_id_seq OWNED BY public.prescriptions.id;


--
-- Name: templates; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.templates (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    name character varying NOT NULL,
    chief_complaints text,
    diagnosis character varying,
    advice text,
    drugs text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    vitals text,
    tests text,
    follow_up_date character varying,
    follow_up_notes text
);


ALTER TABLE public.templates OWNER TO clinic_user;

--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templates_id_seq OWNER TO clinic_user;

--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: tests; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.tests (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    test_type character varying NOT NULL,
    test_name character varying NOT NULL,
    status character varying NOT NULL,
    results text,
    report_url character varying,
    ordered_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


ALTER TABLE public.tests OWNER TO clinic_user;

--
-- Name: tests_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tests_id_seq OWNER TO clinic_user;

--
-- Name: tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.tests_id_seq OWNED BY public.tests.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying,
    hashed_password character varying NOT NULL,
    full_name character varying NOT NULL,
    role character varying NOT NULL,
    is_active boolean
);


ALTER TABLE public.users OWNER TO clinic_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO clinic_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: visit_complaints; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.visit_complaints (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    complaint_id integer,
    custom_complaint character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.visit_complaints OWNER TO clinic_user;

--
-- Name: visit_complaints_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.visit_complaints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_complaints_id_seq OWNER TO clinic_user;

--
-- Name: visit_complaints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.visit_complaints_id_seq OWNED BY public.visit_complaints.id;


--
-- Name: visit_diagnosis; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.visit_diagnosis (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    diagnosis_id integer,
    custom_diagnosis character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.visit_diagnosis OWNER TO clinic_user;

--
-- Name: visit_diagnosis_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.visit_diagnosis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_diagnosis_id_seq OWNER TO clinic_user;

--
-- Name: visit_diagnosis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.visit_diagnosis_id_seq OWNED BY public.visit_diagnosis.id;


--
-- Name: visit_payments; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.visit_payments (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    doctor_fee double precision DEFAULT '0'::double precision,
    lab_fee double precision DEFAULT '0'::double precision,
    total double precision DEFAULT '0'::double precision,
    payment_status character varying DEFAULT 'pending'::character varying,
    payment_mode character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.visit_payments OWNER TO clinic_user;

--
-- Name: visit_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.visit_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_payments_id_seq OWNER TO clinic_user;

--
-- Name: visit_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.visit_payments_id_seq OWNED BY public.visit_payments.id;


--
-- Name: visits; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.visits (
    id integer NOT NULL,
    visit_number character varying NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer,
    status character varying NOT NULL,
    chief_complaints text,
    diagnosis character varying,
    advice text,
    follow_up_date timestamp with time zone,
    follow_up_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    problem_duration character varying
);


ALTER TABLE public.visits OWNER TO clinic_user;

--
-- Name: visits_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visits_id_seq OWNER TO clinic_user;

--
-- Name: visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.visits_id_seq OWNED BY public.visits.id;


--
-- Name: vitals; Type: TABLE; Schema: public; Owner: clinic_user
--

CREATE TABLE public.vitals (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    bp_systolic integer,
    bp_diastolic integer,
    temperature double precision,
    weight double precision,
    sugar double precision,
    created_at timestamp with time zone DEFAULT now(),
    pr integer,
    spo2 integer,
    height_cm double precision
);


ALTER TABLE public.vitals OWNER TO clinic_user;

--
-- Name: vitals_id_seq; Type: SEQUENCE; Schema: public; Owner: clinic_user
--

CREATE SEQUENCE public.vitals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vitals_id_seq OWNER TO clinic_user;

--
-- Name: vitals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: clinic_user
--

ALTER SEQUENCE public.vitals_id_seq OWNED BY public.vitals.id;


--
-- Name: chief_complaints_master id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.chief_complaints_master ALTER COLUMN id SET DEFAULT nextval('public.chief_complaints_master_id_seq'::regclass);


--
-- Name: diagnosis_master id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.diagnosis_master ALTER COLUMN id SET DEFAULT nextval('public.diagnosis_master_id_seq'::regclass);


--
-- Name: doctor_advice_master id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.doctor_advice_master ALTER COLUMN id SET DEFAULT nextval('public.doctor_advice_master_id_seq'::regclass);


--
-- Name: lab_tests_master id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.lab_tests_master ALTER COLUMN id SET DEFAULT nextval('public.lab_tests_master_id_seq'::regclass);


--
-- Name: medicine_brands id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_brands ALTER COLUMN id SET DEFAULT nextval('public.medicine_brands_id_seq'::regclass);


--
-- Name: medicine_dosages id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_dosages ALTER COLUMN id SET DEFAULT nextval('public.medicine_dosages_id_seq'::regclass);


--
-- Name: medicine_drugs id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_drugs ALTER COLUMN id SET DEFAULT nextval('public.medicine_drugs_id_seq'::regclass);


--
-- Name: medicine_types id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_types ALTER COLUMN id SET DEFAULT nextval('public.medicine_types_id_seq'::regclass);


--
-- Name: patient_allergy_history id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_allergy_history ALTER COLUMN id SET DEFAULT nextval('public.patient_allergy_history_id_seq'::regclass);


--
-- Name: patient_family_history id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_family_history ALTER COLUMN id SET DEFAULT nextval('public.patient_family_history_id_seq'::regclass);


--
-- Name: patient_past_history id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_past_history ALTER COLUMN id SET DEFAULT nextval('public.patient_past_history_id_seq'::regclass);


--
-- Name: patient_surgical_history id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_surgical_history ALTER COLUMN id SET DEFAULT nextval('public.patient_surgical_history_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: prescription_drugs id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.prescription_drugs ALTER COLUMN id SET DEFAULT nextval('public.prescription_drugs_id_seq'::regclass);


--
-- Name: prescriptions id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.prescriptions ALTER COLUMN id SET DEFAULT nextval('public.prescriptions_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Name: tests id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.tests ALTER COLUMN id SET DEFAULT nextval('public.tests_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: visit_complaints id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_complaints ALTER COLUMN id SET DEFAULT nextval('public.visit_complaints_id_seq'::regclass);


--
-- Name: visit_diagnosis id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_diagnosis ALTER COLUMN id SET DEFAULT nextval('public.visit_diagnosis_id_seq'::regclass);


--
-- Name: visit_payments id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_payments ALTER COLUMN id SET DEFAULT nextval('public.visit_payments_id_seq'::regclass);


--
-- Name: visits id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visits ALTER COLUMN id SET DEFAULT nextval('public.visits_id_seq'::regclass);


--
-- Name: vitals id; Type: DEFAULT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.vitals ALTER COLUMN id SET DEFAULT nextval('public.vitals_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.alembic_version (version_num) FROM stdin;
med_master_001
\.


--
-- Data for Name: chief_complaints_master; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.chief_complaints_master (id, name, is_active, created_at) FROM stdin;
7	Fever	t	2026-01-25 17:00:38.819603+05:30
12	Headache	t	2026-02-14 16:06:54.707595+05:30
2	Cold	t	2026-01-25 16:54:54.494986+05:30
10	Cough	t	2026-02-14 16:06:24.515217+05:30
11	Giddiness	t	2026-02-14 16:06:36.781243+05:30
5	Epigastric Pain	t	2026-01-25 17:00:22.881513+05:30
9	Nausea	t	2026-01-25 18:24:05.991344+05:30
8	Vomiting	t	2026-01-25 17:46:59.866769+05:30
4	Abdominal Pain	t	2026-01-25 17:00:20.28757+05:30
3	Loose stools	t	2026-01-25 16:56:23.12797+05:30
14	yfhdvfchgvlgeragnvejrngineringegrrer	f	2026-05-23 14:57:45.439968+05:30
16	se	f	2026-05-24 11:19:35.704722+05:30
15	regmlekrmgomrege	f	2026-05-23 14:57:53.993543+05:30
13	nwwee	f	2026-05-17 16:41:54.652927+05:30
6	mn jnkll,;n	f	2026-01-25 17:00:25.732708+05:30
1	Burmining micturation	t	2026-01-25 16:54:48.033776+05:30
17	Knee pain	t	2026-05-24 16:16:13.02767+05:30
\.


--
-- Data for Name: diagnosis_master; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.diagnosis_master (id, name, is_active, created_at) FROM stdin;
3	APD	t	2026-02-14 16:07:23.43405+05:30
4	UTI	t	2026-02-14 16:07:27.482145+05:30
6	Tonsilitis	t	2026-02-14 16:07:42.910913+05:30
1	LRTI	t	2026-01-25 16:55:03.432151+05:30
5	URTI	t	2026-02-14 16:07:33.138229+05:30
2	AGE	t	2026-01-25 17:00:31.258611+05:30
7	AFI	t	2026-05-24 16:18:46.311932+05:30
\.


--
-- Data for Name: doctor_advice_master; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.doctor_advice_master (id, name, is_active, created_at) FROM stdin;
5	Avoid spicy foods	t	2026-02-14 16:08:15.20029+05:30
6	40 min Brisk walking	t	2026-02-14 16:08:29.648502+05:30
7	Aviod fatty foods	t	2026-02-14 16:43:39.384427+05:30
1	Bedrest	t	2026-01-25 16:54:42.485251+05:30
4	Take plenty of oral fluids	t	2026-02-14 16:08:05.865773+05:30
3	Diabetic diet	t	2026-01-25 17:01:01.07535+05:30
11	Low salt diet	t	2026-05-24 11:20:26.228932+05:30
2	SDV	f	2026-01-25 16:55:29.259871+05:30
8	s;ldm	f	2026-05-24 11:20:17.857542+05:30
9	sefm	f	2026-05-24 11:20:20.145944+05:30
10	Low fat diet	t	2026-05-24 11:20:23.096231+05:30
12	நடைபயிற்சி	t	2026-06-06 16:19:17.574876+05:30
13	FBS, PPBS on next review	t	2026-06-06 16:32:00.735296+05:30
14	Lipid profile on next review	t	2026-06-06 16:32:41.791381+05:30
15	jkn	t	2026-06-13 13:25:59.430228+05:30
\.


--
-- Data for Name: lab_tests_master; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.lab_tests_master (id, name, test_type, is_active, created_at) FROM stdin;
2	CBC	Lab	t	2026-01-25 16:55:25.99338+05:30
3	FBS, PPBS	Lab	t	2026-01-25 17:00:54.104325+05:30
5	RBS	Lab	t	2026-02-14 16:08:46.517622+05:30
4	Creat	Lab	t	2026-02-14 16:08:39.109208+05:30
6	Urea	Lab	t	2026-05-24 15:58:38.701809+05:30
1	ECG	Lab	t	2026-01-25 16:55:22.718123+05:30
\.


--
-- Data for Name: medicine_brands; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.medicine_brands (id, drug_id, type_id, name, is_active, created_at) FROM stdin;
1	1	1	dolo	t	2026-06-13 14:18:41.934236+05:30
\.


--
-- Data for Name: medicine_dosages; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.medicine_dosages (id, brand_id, label, default_instruction, is_active, created_at) FROM stdin;
1	1	650 mg	after food	t	2026-06-13 14:19:02.51776+05:30
\.


--
-- Data for Name: medicine_drugs; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.medicine_drugs (id, name, is_active, created_at) FROM stdin;
1	paracatemal	t	2026-06-13 14:12:56.147041+05:30
\.


--
-- Data for Name: medicine_types; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.medicine_types (id, name, is_active, created_at) FROM stdin;
1	tablet	t	2026-06-13 14:18:31.213982+05:30
\.


--
-- Data for Name: patient_allergy_history; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.patient_allergy_history (id, patient_id, value, is_active, created_at) FROM stdin;
1	2	wqd	t	2026-01-25 16:58:42.899608+05:30
2	2	dasc	t	2026-01-25 16:58:46.240408+05:30
3	2	dsca	f	2026-01-25 16:58:48.811275+05:30
4	2	j	t	2026-01-25 17:14:24.116317+05:30
5	2	FEVER	t	2026-01-25 18:24:38.720585+05:30
6	5	nil	t	2026-02-14 16:04:32.777301+05:30
7	6	NSAID ALLERGY	t	2026-05-24 16:39:29.080305+05:30
8	7	nil	t	2026-06-06 16:40:36.124773+05:30
\.


--
-- Data for Name: patient_family_history; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.patient_family_history (id, patient_id, value, is_active, created_at) FROM stdin;
1	2	.kn	t	2026-01-25 17:14:29.434821+05:30
2	6	FATHER DM	t	2026-05-24 16:41:35.490875+05:30
\.


--
-- Data for Name: patient_past_history; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.patient_past_history (id, patient_id, value, is_active, created_at) FROM stdin;
1	2	j	t	2026-01-25 17:18:01.13418+05:30
2	2	sdfghjkl;	t	2026-01-25 17:18:04.01467+05:30
3	2	sdftgyhujil	t	2026-01-25 17:18:06.71918+05:30
5	2	gfchvjbnm	t	2026-01-25 17:18:11.516829+05:30
6	2	hcfcgvjhbn	t	2026-01-25 17:18:16.232515+05:30
7	2	dxgfchgvjhbkjn	t	2026-01-25 17:18:19.103647+05:30
9	2	cv bm	t	2026-01-25 17:18:23.449713+05:30
10	2	dxgfchvbjnm,	f	2026-01-25 17:18:25.782894+05:30
8	2	gcfhvbjn,m	f	2026-01-25 17:18:21.131884+05:30
4	2	gfchvjhb	f	2026-01-25 17:18:09.469353+05:30
11	3	jb	t	2026-01-25 17:49:12.616385+05:30
12	3	h	t	2026-01-25 17:49:14.800203+05:30
13	5	dyslipidemia	t	2026-02-14 16:05:17.457356+05:30
14	5	gastritis	t	2026-02-14 16:05:31.222903+05:30
15	6	DM	t	2026-05-24 16:40:41.155955+05:30
16	6	HTN	t	2026-05-24 16:40:53.538024+05:30
17	6	CAD	t	2026-05-24 16:40:58.037374+05:30
18	7	HT	t	2026-06-06 16:41:01.890921+05:30
19	7	DM	t	2026-06-06 16:41:18.60966+05:30
\.


--
-- Data for Name: patient_surgical_history; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.patient_surgical_history (id, patient_id, value, is_active, created_at) FROM stdin;
1	2	,m	t	2026-01-25 17:14:33.811717+05:30
2	3	u	t	2026-01-25 17:49:22.920681+05:30
4	5	nil	t	2026-02-14 16:04:54.542279+05:30
3	3	ij	t	2026-01-25 17:49:25.830895+05:30
5	4	kjnkj	t	2026-05-23 14:58:15.952174+05:30
6	6	APPENDECTOMY	t	2026-05-24 16:40:25.376549+05:30
7	7	Nil	t	2026-06-06 16:40:48.925871+05:30
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.patients (id, name, phone, age, gender, created_at, updated_at, guardian_name, address, district, age_years, age_months) FROM stdin;
2	mohan	1234567890	0	female	2026-01-24 16:07:45.559714+05:30	\N	father - manoj	anagour	erode	0	3
4	praveen	1234567898	12	male	2026-01-24 16:33:43.978068+05:30	2026-01-25 17:50:22.074506+05:30	father - manoj	8/5-6, Anagour, Kumarapalayam (Tk), Namakkal (Dt), Tamil Nadu – 637304	\N	12	0
1	KRITHICK THANGARAJ	6382003360	12	male	2026-01-24 14:41:36.430077+05:30	2026-01-25 18:26:02.255498+05:30	\N	\N	\N	12	0
5	Sudha	9994481448	39	female	2026-02-14 16:01:01.667789+05:30	\N	Thangaraj	Erode	\N	39	0
6	Sudha	9942650500	0	female	2026-05-24 16:06:03.84835+05:30	2026-05-24 16:56:57.399367+05:30	Thangaraj	Erode	\N	40	0
7	Balaji	9995546554	46	male	2026-06-06 16:11:28.70178+05:30	\N	Ramalingam	Tgode	\N	46	0
3	THANGARAJ	6382003360	0	male	2026-01-24 16:29:00.311164+05:30	2026-06-13 12:12:23.63946+05:30	\N	8/5-6, Anagour, Kumarapalayam (Tk), Namakkal (Dt), Tamil Nadu – 637304	\N	0	9
8	Gowtham	99994481448	0	male	2026-07-26 16:10:53.195083+05:30	\N	Sethupathi	Tgode	\N	0	0
\.


--
-- Data for Name: prescription_drugs; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.prescription_drugs (id, prescription_id, drug_name, dosage, frequency, start_date, number_of_days, end_date, quantity, instructions) FROM stdin;
1	1	Paracetamol	250mg	0-0-1	2026-01-24	7	2026-01-30	7	\N
2	2	Paracetamol	1 tablet	1-0-1	2026-01-24	5	2026-01-28	10	\N
3	2	Atorvastatin	5ml	1-0-1	2026-01-24	6	2026-01-29	12	\N
4	4	Amlodipine	250mg	1-0-0	2026-01-25	5	2026-01-29	5	\N
5	5	Azithromycin	500mg	1-1-1	2026-01-25	3	2026-01-27	9	AFTER FOOD
6	5	Aspirin	500mg	1-1-1	2026-01-25	3	2026-01-27	9	\N
7	6	Pantoprazole	1 tablet	1-0-1	2026-02-14	5	2026-02-18	10	before food
8	6	Cetirizine 10mg	1 tablet	0-0-1	2026-02-14	5	2026-02-18	5	after food
9	7	Diclofenac	250mg	1-0-0	2026-05-23	5	2026-05-27	5	\N
10	7	Doxycycline	250mg	1-0-0	2026-05-23	5	2026-05-27	5	\N
17	11	Metronidazole	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
18	11	Metronidazole	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
19	11	Metronidazole	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
20	11	Metronidazole	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
22	13	Doxycycline	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
23	13	Paracetamol	500mg	1-1-1	2026-05-24	2	2026-05-25	6	\N
24	14	Metronidazole	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
25	14	Metronidazole	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
26	14	Metronidazole	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
27	14	Metronidazole	250mg	1-0-0	2026-05-24	5	2026-05-28	5	\N
34	18	Paracetamol	500mg	1-1-1-1	2026-06-06	3	2026-06-08	12	\N
35	18	Omeprazole	250mg	1-0-1	2026-06-06	2	2026-06-07	4	Before food
48	31	Pantoprazole	500mg	1-0-1	2026-06-06	5	2026-06-10	10	\N
49	32	Metformin	250mg	1-0-0	2026-05-23	5	2026-05-27	5	\N
50	32	Metformin	250mg	1-0-0	2026-05-23	5	2026-05-27	5	\N
51	32	Clindamycin	250mg	1-0-0	2026-05-23	5	2026-05-27	5	\N
52	32	Atorvastatin	250mg	1-0-0	2026-05-23	5	2026-05-27	5	\N
53	32	Metronidazole	250mg	1-0-0	2026-05-23	5	2026-05-27	5	\N
54	32	Omeprazole	250mg	1-0-0	2026-05-23	5	2026-05-27	5	io
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.prescriptions (id, visit_id, doctor_id, created_at, printed_at) FROM stdin;
1	1	1	2026-01-24 14:42:52.022752+05:30	2026-01-24 09:13:06.492959+05:30
2	4	1	2026-01-24 15:16:57.015612+05:30	2026-01-24 09:47:37.164591+05:30
4	15	1	2026-01-25 16:55:38.712877+05:30	\N
5	17	1	2026-01-25 18:23:29.347476+05:30	\N
6	21	1	2026-02-14 16:12:02.931224+05:30	2026-02-14 10:43:14.66267+05:30
7	27	2	2026-05-23 15:31:44.278438+05:30	2026-05-23 10:01:59.150107+05:30
11	28	1	2026-05-24 17:13:18.575231+05:30	\N
13	29	1	2026-05-24 17:22:23.02526+05:30	2026-05-24 11:58:38.40617+05:30
14	31	1	2026-06-06 16:07:28.962628+05:30	\N
18	32	1	2026-06-06 16:20:24.516313+05:30	\N
31	33	1	2026-06-06 16:46:48.009886+05:30	\N
32	34	1	2026-06-13 13:26:03.353701+05:30	\N
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.templates (id, doctor_id, name, chief_complaints, diagnosis, advice, drugs, created_at, updated_at, vitals, tests, follow_up_date, follow_up_notes) FROM stdin;
1	1	e4yiuwekhfbM	["Fever", "Cold"]	ertcyvbjkn	1w2ergh	[]	2026-01-24 15:28:05.584553+05:30	\N	\N	\N	\N	\N
2	1	sample	["LKJN", "caugh", "lkl", "jn", ",m ,", "mn jnkll,;n", ";kl"]	mhbm	SDV, jkn	[]	2026-01-25 17:01:17.021119+05:30	\N	\N	\N	\N	\N
4	2	i	["LKJN", "caugh", "lkl", "jn", ",m ,", "mn jnkll,;n", ";kl", "fever", "regmlekrmgomrege"]	mhbm, APD, AGE, ad,m		[]	2026-05-23 15:31:11.319588+05:30	\N	\N	\N	\N	\N
5	1	test	[";klewf", "back pain", "caugh", "cough", "fever"]	AGE, APD	40 min Brisk walking, Avoid spicy foods	[{"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-24", "number_of_days": 5, "end_date": "2026-05-28", "quantity": 5}, {"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-24", "number_of_days": 5, "end_date": "2026-05-28", "quantity": 5}, {"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-24", "number_of_days": 5, "end_date": "2026-05-28", "quantity": 5}, {"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-24", "number_of_days": 5, "end_date": "2026-05-28", "quantity": 5}]	2026-05-24 15:50:39.574489+05:30	\N	\N	\N	\N	\N
3	1	test1	["LKJN", "caugh", "lkl", "jn", ",m ,", "mn jnkll,;n", ";kl", "fever", "regmlekrmgomrege"]	mhbm, APD, AGE, ad, m	SDV, jkn, 40 min Brisk walking, Avoid spicy foods	[{"drug_name": "Metformin", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-23", "number_of_days": 5, "end_date": "2026-05-27", "quantity": 5}, {"drug_name": "Metformin", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-23", "number_of_days": 5, "end_date": "2026-05-27", "quantity": 5}, {"drug_name": "Clindamycin", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-23", "number_of_days": 5, "end_date": "2026-05-27", "quantity": 5}, {"drug_name": "Atorvastatin", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-23", "number_of_days": 5, "end_date": "2026-05-27", "quantity": 5}, {"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-23", "number_of_days": 5, "end_date": "2026-05-27", "quantity": 5}, {"drug_name": "Omeprazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": "io", "start_date": "2026-05-23", "number_of_days": 5, "end_date": "2026-05-27", "quantity": 5}]	2026-05-23 15:19:49.864739+05:30	2026-05-24 15:58:40.944352+05:30	{"height_cm": null, "weight": null, "sugar": null, "bp_systolic": null, "bp_diastolic": null, "temperature": null, "pr": null, "spo2": null}	[{"test_name": "Lipid profile", "test_type": "Lab", "status": "ordered"}, {"test_name": "RBS (Random Blood Sugar)", "test_type": "Lab", "status": "ordered"}]	\N	
6	1	AFI	["Fever", "Headache", "Vomiting", "Loose stools", "Knee pain"]	AFI		[]	2026-05-24 16:32:16.372851+05:30	\N	{"id": 23, "visit_id": 29, "bp_systolic": 120, "bp_diastolic": 80, "temperature": 36.666666666666664, "weight": 60, "height_cm": 180, "pr": 76, "spo2": 90, "sugar": 115, "created_at": "2026-05-24T16:06:03.918119+05:30"}	[{"test_name": "CBC", "test_type": "Lab", "status": "ordered"}, {"test_name": "Creat", "test_type": "Lab", "status": "ordered"}, {"test_name": "ECG", "test_type": "Lab", "status": "ordered"}, {"test_name": "RBS", "test_type": "Lab", "status": "ordered"}]	2026-06-24	
7	1	test	[";klewf", "back pain", "caugh", "Cough", "Fever", "Burmining micturation"]	AGE, APD, Tonsilitis	40 min Brisk walking, Avoid spicy foods	[{"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-24", "number_of_days": 5, "end_date": "2026-05-28", "quantity": 5}, {"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-24", "number_of_days": 5, "end_date": "2026-05-28", "quantity": 5}, {"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-24", "number_of_days": 5, "end_date": "2026-05-28", "quantity": 5}, {"drug_name": "Metronidazole", "dosage": "250mg", "frequency": "1-0-0", "instructions": null, "start_date": "2026-05-24", "number_of_days": 5, "end_date": "2026-05-28", "quantity": 5}]	2026-06-06 16:07:52.697541+05:30	\N	{"bp_systolic": 120, "bp_diastolic": 80, "temperature": 37.77777777777778, "weight": 70, "height_cm": 170, "pr": 72, "spo2": 98, "sugar": 99.8}	[{"test_name": "ECG", "test_type": "Lab", "status": "ordered"}, {"test_name": "RBS (Random Blood Sugar)", "test_type": "Lab", "status": "ordered"}]	2026-06-09	
\.


--
-- Data for Name: tests; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.tests (id, visit_id, test_type, test_name, status, results, report_url, ordered_at, completed_at) FROM stdin;
1	4	Lab	x ray	ordered	\N	\N	2026-01-24 15:16:57.039926+05:30	\N
2	7	Lab	xray	ordered	\N	\N	2026-01-24 17:21:32.519721+05:30	\N
3	15	Lab	SA	ordered	\N	\N	2026-01-25 16:55:38.7351+05:30	\N
4	15	Lab	DAV	ordered	\N	\N	2026-01-25 16:55:38.741569+05:30	\N
5	12	Lab	DAV	ordered	\N	\N	2026-01-25 17:01:20.229675+05:30	\N
6	12	Lab	SA	ordered	\N	\N	2026-01-25 17:01:20.24363+05:30	\N
7	12	Lab	Sugar	ordered	\N	\N	2026-01-25 17:01:20.252577+05:30	\N
8	12	Lab	kjb	ordered	\N	\N	2026-01-25 17:01:20.261012+05:30	\N
9	17	Lab	kjb	ordered	\N	\N	2026-01-25 18:23:29.396155+05:30	\N
10	17	Lab	Sugar	ordered	\N	\N	2026-01-25 18:23:29.404906+05:30	\N
11	17	Lab	CBC	ordered	\N	\N	2026-01-25 18:23:29.410996+05:30	\N
12	21	Lab	RBS	ordered	\N	\N	2026-02-14 16:12:02.949316+05:30	\N
13	21	Lab	Lipid profile	ordered	\N	\N	2026-02-14 16:12:02.95899+05:30	\N
14	28	Lab	Lipid profile	ordered	\N	\N	2026-05-24 15:50:43.127055+05:30	\N
15	28	Lab	SA	ordered	\N	\N	2026-05-24 15:50:43.14067+05:30	\N
16	28	Lab	RBS (Random Blood Sugar)	ordered	\N	\N	2026-05-24 15:50:43.148326+05:30	\N
17	30	Lab	CBC	ordered	\N	\N	2026-05-24 16:33:40.066011+05:30	\N
18	30	Lab	Creat	ordered	\N	\N	2026-05-24 16:33:40.086484+05:30	\N
19	30	Lab	ECG	ordered	\N	\N	2026-05-24 16:33:40.095742+05:30	\N
20	30	Lab	RBS	ordered	\N	\N	2026-05-24 16:33:40.103285+05:30	\N
21	29	Lab	CBC	ordered	\N	\N	2026-05-24 16:37:26.483937+05:30	\N
22	29	Lab	Creat	ordered	\N	\N	2026-05-24 16:37:26.500848+05:30	\N
23	29	Lab	ECG	ordered	\N	\N	2026-05-24 16:37:26.509672+05:30	\N
24	29	Lab	RBS	ordered	\N	\N	2026-05-24 16:37:26.517616+05:30	\N
25	29	Lab	CBC	ordered	\N	\N	2026-05-24 16:45:01.400149+05:30	\N
26	29	Lab	Creat	ordered	\N	\N	2026-05-24 16:45:01.422512+05:30	\N
27	29	Lab	ECG	ordered	\N	\N	2026-05-24 16:45:01.430699+05:30	\N
28	29	Lab	RBS	ordered	\N	\N	2026-05-24 16:45:01.438345+05:30	\N
29	29	Lab	CBC	ordered	\N	\N	2026-05-24 16:46:40.794443+05:30	\N
30	29	Lab	Creat	ordered	\N	\N	2026-05-24 16:46:40.801591+05:30	\N
31	29	Lab	ECG	ordered	\N	\N	2026-05-24 16:46:40.808486+05:30	\N
32	29	Lab	RBS	ordered	\N	\N	2026-05-24 16:46:40.814759+05:30	\N
33	29	Lab	CBC	ordered	\N	\N	2026-05-24 16:47:48.131021+05:30	\N
34	29	Lab	Creat	ordered	\N	\N	2026-05-24 16:47:48.141493+05:30	\N
35	29	Lab	ECG	ordered	\N	\N	2026-05-24 16:47:48.149933+05:30	\N
36	29	Lab	RBS	ordered	\N	\N	2026-05-24 16:47:48.158336+05:30	\N
37	31	Lab	ECG	ordered	\N	\N	2026-06-06 16:07:28.98896+05:30	\N
38	31	Lab	RBS (Random Blood Sugar)	ordered	\N	\N	2026-06-06 16:07:29.000324+05:30	\N
39	32	Lab	CBC	ordered	\N	\N	2026-06-06 16:15:40.060533+05:30	\N
40	32	Lab	ECG	ordered	\N	\N	2026-06-06 16:15:40.071277+05:30	\N
41	32	Lab	CBC	ordered	\N	\N	2026-06-06 16:19:27.908051+05:30	\N
42	32	Lab	ECG	ordered	\N	\N	2026-06-06 16:19:27.918946+05:30	\N
43	32	Lab	CBC	ordered	\N	\N	2026-06-06 16:19:47.209987+05:30	\N
44	32	Lab	ECG	ordered	\N	\N	2026-06-06 16:19:47.222155+05:30	\N
45	32	Lab	CBC	ordered	\N	\N	2026-06-06 16:20:24.530475+05:30	\N
46	32	Lab	ECG	ordered	\N	\N	2026-06-06 16:20:24.536071+05:30	\N
47	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:27:03.773376+05:30	\N
48	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:27:03.783413+05:30	\N
49	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:27:03.80209+05:30	\N
50	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:30:48.241318+05:30	\N
51	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:30:48.249116+05:30	\N
52	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:30:48.260991+05:30	\N
53	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:32:44.785469+05:30	\N
54	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:32:44.795929+05:30	\N
55	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:32:44.805961+05:30	\N
56	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:33:36.483917+05:30	\N
57	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:33:36.494435+05:30	\N
58	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:33:36.506132+05:30	\N
59	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:34:19.373188+05:30	\N
60	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:34:19.381212+05:30	\N
61	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:34:19.388888+05:30	\N
62	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:34:33.59453+05:30	\N
63	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:34:33.604788+05:30	\N
64	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:34:33.615376+05:30	\N
65	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:35:33.444767+05:30	\N
66	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:35:33.456048+05:30	\N
67	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:35:33.467018+05:30	\N
68	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:35:41.207798+05:30	\N
69	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:35:41.218046+05:30	\N
70	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:35:41.228486+05:30	\N
71	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:38:46.374461+05:30	\N
72	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:38:46.38352+05:30	\N
73	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:38:46.392132+05:30	\N
74	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:40:03.204623+05:30	\N
75	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:40:03.212092+05:30	\N
76	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:40:03.218667+05:30	\N
77	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:41:28.063264+05:30	\N
78	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:41:28.073534+05:30	\N
79	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:41:28.083225+05:30	\N
80	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:46:28.228272+05:30	\N
81	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:46:28.239141+05:30	\N
82	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:46:28.249228+05:30	\N
83	33	Lab	CBC	ordered	\N	\N	2026-06-06 16:46:48.026584+05:30	\N
84	33	Lab	ECG	ordered	\N	\N	2026-06-06 16:46:48.037004+05:30	\N
85	33	Lab	FBS, PPBS	ordered	\N	\N	2026-06-06 16:46:48.047405+05:30	\N
86	34	Lab	Lipid profile	ordered	\N	\N	2026-06-13 13:26:03.386601+05:30	\N
87	34	Lab	RBS (Random Blood Sugar)	ordered	\N	\N	2026-06-13 13:26:03.402449+05:30	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.users (id, username, email, hashed_password, full_name, role, is_active) FROM stdin;
1	admin	admin@clinic.com	$2b$12$XcRnhxLyty7mPPyUSa06MurM3Mxl.YAeYi7SwgLb5XCMgaLRHLWf6	Administrator	admin	t
2	doctor	doctor@clinic.com	$2b$12$4pfF3MSHBCh0SbPtCFurH.iV4pI8yKQsFJcswAq.AcyC8pLoBfeXm	Dr. John Doe	doctor	t
3	reception	reception@clinic.com	$2b$12$17i1YnMP025Hq8vy74ufP.3ukF9savSSLWJNVGliEO5r138k/yGym	Reception Staff	reception	t
\.


--
-- Data for Name: visit_complaints; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.visit_complaints (id, visit_id, complaint_id, custom_complaint, created_at) FROM stdin;
1	15	\N	Fever	2026-01-25 16:54:42.421532+05:30
2	15	\N	Cold	2026-01-25 16:54:42.444425+05:30
3	15	1	\N	2026-01-25 16:54:48.052053+05:30
4	15	2	\N	2026-01-25 16:54:54.50368+05:30
5	12	3	\N	2026-01-25 16:56:23.14597+05:30
165	31	\N	;klewf	2026-06-06 16:07:05.642027+05:30
166	31	\N	back pain	2026-06-06 16:07:05.672736+05:30
167	31	\N	caugh	2026-06-06 16:07:05.685513+05:30
168	31	10	\N	2026-06-06 16:07:05.697108+05:30
10	12	6	\N	2026-01-25 17:00:25.757111+05:30
11	12	7	\N	2026-01-25 17:00:38.830881+05:30
169	31	7	\N	2026-06-06 16:07:05.71285+05:30
170	31	1	\N	2026-06-06 16:07:25.160562+05:30
171	32	7	\N	2026-06-06 16:12:44.669482+05:30
172	32	17	\N	2026-06-06 16:12:52.347228+05:30
16	12	8	\N	2026-01-25 17:46:59.891486+05:30
173	32	9	\N	2026-06-06 16:12:53.679297+05:30
174	32	3	\N	2026-06-06 16:12:54.862241+05:30
175	33	4	\N	2026-06-06 16:22:43.212286+05:30
176	33	8	\N	2026-06-06 16:22:50.295422+05:30
21	16	3	\N	2026-01-25 17:51:10.614413+05:30
22	16	2	\N	2026-01-25 17:51:10.623544+05:30
23	16	1	\N	2026-01-25 17:51:10.631231+05:30
24	16	4	\N	2026-01-25 17:51:10.638784+05:30
25	16	5	\N	2026-01-25 17:51:10.64627+05:30
26	16	6	\N	2026-01-25 17:51:10.655234+05:30
27	16	7	\N	2026-01-25 17:51:10.662641+05:30
28	13	3	\N	2026-01-25 18:01:10.008923+05:30
29	13	2	\N	2026-01-25 18:01:10.034441+05:30
30	13	1	\N	2026-01-25 18:01:10.044271+05:30
31	13	4	\N	2026-01-25 18:01:10.05692+05:30
32	13	5	\N	2026-01-25 18:01:10.074362+05:30
33	13	6	\N	2026-01-25 18:01:10.082543+05:30
34	13	7	\N	2026-01-25 18:01:10.130085+05:30
35	17	7	\N	2026-01-25 18:22:23.396258+05:30
36	17	2	\N	2026-01-25 18:22:24.526443+05:30
37	17	4	\N	2026-01-25 18:22:25.24611+05:30
38	17	3	\N	2026-01-25 18:22:25.595576+05:30
39	12	2	\N	2026-01-25 18:23:56.938068+05:30
40	12	1	\N	2026-01-25 18:23:57.411155+05:30
42	12	9	\N	2026-01-25 18:24:11.798417+05:30
43	18	3	\N	2026-01-25 18:26:27.441186+05:30
44	18	2	\N	2026-01-25 18:26:27.45269+05:30
45	18	1	\N	2026-01-25 18:26:27.459479+05:30
46	18	4	\N	2026-01-25 18:26:27.466245+05:30
47	18	5	\N	2026-01-25 18:26:27.471927+05:30
48	18	6	\N	2026-01-25 18:26:27.477436+05:30
49	18	7	\N	2026-01-25 18:26:27.48278+05:30
178	33	2	\N	2026-06-06 16:29:32.322745+05:30
51	21	10	\N	2026-02-14 16:06:24.529366+05:30
52	21	11	\N	2026-02-14 16:06:36.792863+05:30
53	21	9	\N	2026-02-14 16:06:39.440736+05:30
179	33	1	\N	2026-06-06 16:39:57.412247+05:30
55	21	12	\N	2026-02-14 16:07:00.974863+05:30
180	33	7	\N	2026-06-06 16:39:58.40692+05:30
181	33	12	\N	2026-06-06 16:39:59.808795+05:30
63	21	1	\N	2026-02-14 16:42:56.698362+05:30
64	21	6	\N	2026-02-14 16:42:59.345182+05:30
65	21	3	\N	2026-02-14 16:43:00.896808+05:30
187	34	\N	LKJN	2026-06-13 13:25:59.17206+05:30
188	34	\N	caugh	2026-06-13 13:25:59.18986+05:30
189	34	\N	lkl	2026-06-13 13:25:59.200117+05:30
190	34	\N	jn	2026-06-13 13:25:59.210009+05:30
191	34	\N	,m ,	2026-06-13 13:25:59.219733+05:30
192	34	\N	mn jnkll,;n	2026-06-13 13:25:59.229257+05:30
193	34	\N	;kl	2026-06-13 13:25:59.238066+05:30
194	34	7	\N	2026-06-13 13:25:59.248639+05:30
195	34	\N	regmlekrmgomrege	2026-06-13 13:25:59.260255+05:30
76	23	3	\N	2026-05-12 18:58:00.387116+05:30
77	23	2	\N	2026-05-12 18:58:00.396335+05:30
78	23	1	\N	2026-05-12 18:58:00.409942+05:30
79	23	4	\N	2026-05-12 18:58:00.421462+05:30
80	23	5	\N	2026-05-12 18:58:00.430298+05:30
81	23	6	\N	2026-05-12 18:58:00.439387+05:30
82	23	7	\N	2026-05-12 18:58:00.449366+05:30
83	24	12	\N	2026-05-17 16:38:18.543068+05:30
84	24	2	\N	2026-05-17 16:38:20.44935+05:30
86	24	5	\N	2026-05-17 16:41:28.196807+05:30
87	24	9	\N	2026-05-17 16:41:32.811874+05:30
88	24	13	\N	2026-05-17 16:41:54.674419+05:30
89	26	5	\N	2026-05-23 14:57:33.270411+05:30
90	26	12	\N	2026-05-23 14:57:34.200868+05:30
91	26	10	\N	2026-05-23 14:57:34.733615+05:30
92	26	11	\N	2026-05-23 14:57:35.168159+05:30
93	26	9	\N	2026-05-23 14:57:35.667649+05:30
94	26	4	\N	2026-05-23 14:57:35.851599+05:30
95	26	3	\N	2026-05-23 14:57:36.036885+05:30
96	26	1	\N	2026-05-23 14:57:36.236594+05:30
97	26	6	\N	2026-05-23 14:57:36.418282+05:30
98	26	13	\N	2026-05-23 14:57:36.618725+05:30
99	26	8	\N	2026-05-23 14:57:37.216706+05:30
100	26	2	\N	2026-05-23 14:57:37.702012+05:30
101	26	7	\N	2026-05-23 14:57:38.384045+05:30
102	26	14	\N	2026-05-23 14:57:45.455693+05:30
103	26	15	\N	2026-05-23 14:57:54.007639+05:30
204	39	7	\N	2026-07-26 16:25:18.223479+05:30
205	39	12	\N	2026-07-26 16:25:18.243318+05:30
206	39	8	\N	2026-07-26 16:25:18.251807+05:30
207	39	3	\N	2026-07-26 16:25:18.259341+05:30
208	39	17	\N	2026-07-26 16:25:18.267442+05:30
115	27	3	\N	2026-05-23 15:31:18.875987+05:30
116	27	2	\N	2026-05-23 15:31:18.88627+05:30
117	27	1	\N	2026-05-23 15:31:18.894377+05:30
118	27	4	\N	2026-05-23 15:31:18.903493+05:30
119	27	\N	,m ,	2026-05-23 15:31:18.91233+05:30
120	27	6	\N	2026-05-23 15:31:18.920283+05:30
121	27	7	\N	2026-05-23 15:31:18.929009+05:30
122	27	5	\N	2026-05-23 15:31:18.937941+05:30
123	27	15	\N	2026-05-23 15:31:18.945406+05:30
124	28	7	\N	2026-05-24 11:20:53.632006+05:30
125	28	12	\N	2026-05-24 11:20:54.545771+05:30
126	28	2	\N	2026-05-24 11:20:54.776326+05:30
127	28	11	\N	2026-05-24 11:20:54.978222+05:30
128	28	5	\N	2026-05-24 11:20:55.177919+05:30
155	30	7	\N	2026-05-24 16:33:11.131721+05:30
156	30	12	\N	2026-05-24 16:33:11.138652+05:30
157	30	8	\N	2026-05-24 16:33:11.145129+05:30
158	30	3	\N	2026-05-24 16:33:11.151104+05:30
159	30	17	\N	2026-05-24 16:33:11.15698+05:30
160	29	7	\N	2026-05-24 16:34:54.944216+05:30
161	29	12	\N	2026-05-24 16:34:54.970335+05:30
162	29	8	\N	2026-05-24 16:34:54.977811+05:30
163	29	3	\N	2026-05-24 16:34:55.017982+05:30
164	29	17	\N	2026-05-24 16:34:55.027167+05:30
\.


--
-- Data for Name: visit_diagnosis; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.visit_diagnosis (id, visit_id, diagnosis_id, custom_diagnosis, created_at) FROM stdin;
1	15	\N	ertcyvbjkn	2026-01-25 16:54:42.45998+05:30
2	15	1	\N	2026-01-25 16:55:03.447523+05:30
3	12	2	\N	2026-01-25 17:00:31.288552+05:30
6	16	2	\N	2026-01-25 17:51:10.68599+05:30
7	13	2	\N	2026-01-25 18:01:10.185737+05:30
8	17	1	\N	2026-01-25 18:22:28.016135+05:30
9	17	2	\N	2026-01-25 18:22:29.112133+05:30
10	18	2	\N	2026-01-25 18:26:27.495833+05:30
11	21	3	\N	2026-02-14 16:07:23.446431+05:30
12	21	4	\N	2026-02-14 16:07:27.489409+05:30
13	21	5	\N	2026-02-14 16:07:33.152978+05:30
14	21	6	\N	2026-02-14 16:07:42.922431+05:30
16	21	1	\N	2026-02-14 16:43:03.653753+05:30
20	23	2	\N	2026-05-12 18:58:00.487258+05:30
26	27	2	\N	2026-05-23 15:31:19.089823+05:30
27	27	3	\N	2026-05-23 15:31:19.101429+05:30
28	27	5	\N	2026-05-23 15:31:19.115966+05:30
29	27	\N	ad	2026-05-23 15:31:19.131191+05:30
30	27	\N	m	2026-05-23 15:31:19.148638+05:30
31	28	5	\N	2026-05-24 11:20:56.064387+05:30
32	28	3	\N	2026-05-24 11:20:57.060814+05:30
40	30	7	\N	2026-05-24 16:33:11.176789+05:30
41	29	7	\N	2026-05-24 16:34:55.073476+05:30
42	31	2	\N	2026-06-06 16:07:05.734669+05:30
43	31	3	\N	2026-06-06 16:07:05.746648+05:30
44	31	6	\N	2026-06-06 16:07:23.870152+05:30
45	32	7	\N	2026-06-06 16:13:28.197869+05:30
46	33	3	\N	2026-06-06 16:22:53.178528+05:30
47	33	7	\N	2026-06-06 16:39:52.045607+05:30
48	33	1	\N	2026-06-06 16:39:52.892769+05:30
49	33	5	\N	2026-06-06 16:39:53.709371+05:30
50	33	6	\N	2026-06-06 16:39:55.441881+05:30
53	34	\N	mhbm	2026-06-13 13:25:59.325633+05:30
54	34	3	\N	2026-06-13 13:25:59.342758+05:30
55	34	2	\N	2026-06-13 13:25:59.350496+05:30
56	34	\N	ad	2026-06-13 13:25:59.358216+05:30
57	34	\N	m	2026-06-13 13:25:59.364375+05:30
62	39	7	\N	2026-07-26 16:25:18.322303+05:30
\.


--
-- Data for Name: visit_payments; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.visit_payments (id, visit_id, doctor_fee, lab_fee, total, payment_status, payment_mode, created_at, updated_at) FROM stdin;
1	12	120	0	120	pending	\N	2026-01-25 17:01:20.269915+05:30	\N
2	17	299.98	0	299.98	pending	\N	2026-01-25 18:23:29.418939+05:30	\N
3	21	130	0	130	pending	\N	2026-02-14 16:12:02.966202+05:30	\N
4	28	90.01	0	90.01	pending	\N	2026-05-24 15:50:43.160149+05:30	\N
5	31	100.02	0	100.02	pending	\N	2026-06-06 16:07:29.011366+05:30	\N
6	32	100	0	100	pending	\N	2026-06-06 16:15:40.083134+05:30	\N
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.visits (id, visit_number, patient_id, doctor_id, status, chief_complaints, diagnosis, advice, follow_up_date, follow_up_notes, created_at, updated_at, problem_duration) FROM stdin;
23	V-20260512-001	3	1	completed	\N	\N		\N		2026-05-12 18:56:03.878776+05:30	2026-05-12 18:58:16.304428+05:30	\N
1	V-20260124-001	1	1	completed	["Cold", "Fever", "Cough"]			\N		2026-01-24 14:41:36.430077+05:30	2026-01-24 14:43:06.490349+05:30	\N
2	V-20260124-002	1	\N	registered	\N	\N	\N	\N	\N	2026-01-24 14:43:54.587309+05:30	\N	\N
3	V-20260124-003	1	\N	registered	\N	\N	\N	\N	\N	2026-01-24 14:49:33.12338+05:30	\N	\N
24	V-20260517-001	3	1	in_consultation	\N	\N	\N	\N	\N	2026-05-17 15:56:48.262603+05:30	2026-05-17 15:56:53.574956+05:30	\N
25	V-20260517-002	1	\N	registered	\N	\N	\N	\N	\N	2026-05-17 16:10:59.074071+05:30	\N	\N
4	V-20260124-004	1	1	completed	["Cold", "Fever", "Cough", "Headache"]		doctore adive	2026-01-15 00:00:00+05:30	qwertyjk	2026-01-24 15:06:35.426547+05:30	2026-01-24 15:17:37.161791+05:30	\N
6	V-20260124-006	2	\N	vitals_done	\N	\N	\N	\N	\N	2026-01-24 16:07:45.559714+05:30	2026-01-24 16:07:45.608263+05:30	\N
5	V-20260124-005	1	1	consulted	["Fever", "Cold"]	ertcyvbjkn	1w2ergh	\N		2026-01-24 15:26:59.602926+05:30	2026-01-24 16:24:09.062563+05:30	\N
8	V-20260124-008	3	\N	registered	\N	\N	\N	\N	\N	2026-01-24 16:29:00.311164+05:30	\N	\N
9	V-20260124-009	2	\N	vitals_done	\N	\N	\N	\N	\N	2026-01-24 16:32:27.594203+05:30	2026-01-24 16:32:30.158185+05:30	\N
10	V-20260124-010	4	\N	vitals_done	\N	\N	\N	\N	\N	2026-01-24 16:33:43.978068+05:30	2026-01-24 16:33:44.000398+05:30	\N
11	V-20260124-011	2	\N	registered	\N	\N	\N	\N	\N	2026-01-24 17:08:35.845246+05:30	\N	\N
7	V-20260124-007	2	1	consulted	["Fever", "Cold", "Dizziness", "Weakness"]	ertcyvbjkn	1w2ergh	2026-01-08 00:00:00+05:30	awesrdthfjj	2026-01-24 16:09:15.777786+05:30	2026-01-24 17:21:32.491902+05:30	\N
31	V-20260606-001	3	1	consulted	\N	\N	40 min Brisk walking, Avoid spicy foods	2026-06-09 00:00:00+05:30		2026-06-06 16:06:10.112251+05:30	2026-06-06 16:07:28.962628+05:30	\N
26	V-20260523-001	4	1	completed	\N	\N		\N		2026-05-23 13:54:10.235411+05:30	2026-05-23 14:26:51.919788+05:30	\N
35	V-20260613-002	3	1	in_consultation	\N	\N	\N	\N	\N	2026-06-13 12:12:23.649671+05:30	2026-06-13 12:37:38.019733+05:30	\N
14	V-20260125-003	3	\N	registered	\N	\N	\N	\N	\N	2026-01-25 16:22:55.780201+05:30	\N	\N
27	V-20260523-002	3	2	completed	\N	\N	Avoid spicy foods	\N		2026-05-23 15:18:13.379198+05:30	2026-05-23 15:31:59.147129+05:30	\N
37	260613-004	1	\N	vitals_done	\N	\N	\N	\N	\N	2026-06-13 13:18:46.682755+05:30	2026-06-13 13:18:46.719467+05:30	\N
15	V-20260125-004	2	1	consulted	\N	\N	1w2ergh, SDV	2026-01-16 00:00:00+05:30		2026-01-25 16:47:33.610676+05:30	2026-01-25 16:55:38.712877+05:30	\N
12	V-20260125-001	2	1	completed	["Fever", "Cold", "body heat "]	ertcyvbjkn	SDV, jkn	\N	2e	2026-01-25 15:15:26.959201+05:30	2026-01-25 17:01:20.202706+05:30	\N
13	V-20260125-002	3	1	completed	\N	\N		\N		2026-01-25 15:16:11.650872+05:30	2026-01-25 17:49:37.51131+05:30	\N
38	260613-005	7	\N	vitals_done	\N	\N	\N	\N	\N	2026-06-13 13:18:59.436246+05:30	2026-06-13 13:18:59.45099+05:30	\N
16	V-20260125-005	4	1	completed	\N	\N	SDV, jkn	\N		2026-01-25 17:50:22.095578+05:30	2026-01-25 17:51:14.15249+05:30	\N
36	V-20260613-003	1	1	in_consultation	\N	\N	\N	\N	\N	2026-06-13 12:13:02.684988+05:30	2026-06-13 13:23:07.286239+05:30	\N
34	V-20260613-001	3	1	consulted	\N	\N	jkn, 40 min Brisk walking, Avoid spicy foods	\N		2026-06-13 12:11:55.03514+05:30	2026-06-13 13:26:03.353701+05:30	2 Days
17	V-20260125-006	4	1	consulted	\N	\N	1w2ergh	2026-01-27 00:00:00+05:30		2026-01-25 18:21:39.067119+05:30	2026-01-25 18:23:29.347476+05:30	\N
18	V-20260125-007	1	1	in_consultation	\N	\N	\N	\N	\N	2026-01-25 18:26:02.266773+05:30	2026-01-25 18:26:08.76195+05:30	\N
32	V-20260606-002	7	1	consulted	\N	\N	Avoid spicy foods, நடைபயிற்சி	2026-06-09 00:00:00+05:30		2026-06-06 16:11:28.70178+05:30	2026-06-06 16:20:24.516313+05:30	\N
30	V-20260524-003	4	1	completed	\N	\N		2026-06-24 00:00:00+05:30		2026-05-24 16:07:26.05657+05:30	2026-05-24 16:33:40.037194+05:30	\N
21	V-20260214-003	5	1	completed	\N	\N	Bed rest, Avoid spicy foods, 40 min Brisk walking	2026-02-20 00:00:00+05:30		2026-02-14 16:01:01.667789+05:30	2026-02-14 16:13:14.658974+05:30	\N
20	V-20260214-002	2	1	in_consultation	\N	\N	\N	\N	\N	2026-02-14 15:58:17.703768+05:30	2026-02-14 16:14:53.739537+05:30	\N
19	V-20260214-001	3	1	in_consultation	\N	\N	\N	\N	\N	2026-02-14 15:58:09.23216+05:30	2026-02-14 16:16:43.220137+05:30	\N
39	V-20260726-001	8	1	in_consultation	\N	\N	\N	\N	\N	2026-07-26 16:10:53.195083+05:30	2026-07-26 16:11:51.990647+05:30	\N
22	V-20260214-004	5	1	in_consultation	\N	\N	\N	\N	\N	2026-02-14 16:33:15.82835+05:30	2026-02-14 16:39:46.035536+05:30	\N
33	V-20260606-003	7	1	consulted	\N	\N	நடைபயிற்சி, FBS, PPBS on next review, Lipid profile on next review	2026-09-08 00:00:00+05:30	PPBS on next review	2026-06-06 16:21:40.748932+05:30	2026-06-06 16:46:48.009886+05:30	\N
28	V-20260524-001	3	1	consulted	\N	\N		2026-05-24 00:00:00+05:30		2026-05-24 11:19:49.577124+05:30	2026-05-24 17:13:18.575231+05:30	\N
29	V-20260524-002	6	1	completed	\N	\N		2026-06-22 00:00:00+05:30		2026-05-24 16:06:03.84835+05:30	2026-05-24 17:28:38.403985+05:30	\N
\.


--
-- Data for Name: vitals; Type: TABLE DATA; Schema: public; Owner: clinic_user
--

COPY public.vitals (id, visit_id, bp_systolic, bp_diastolic, temperature, weight, sugar, created_at, pr, spo2, height_cm) FROM stdin;
1	1	12	80	98.6	70	100	2026-01-24 14:41:52.449349+05:30	\N	\N	\N
2	4	120	80	98.6	70	100	2026-01-24 15:06:52.02266+05:30	\N	\N	\N
3	5	120	80	12	12	12	2026-01-24 15:27:08.440232+05:30	\N	\N	\N
4	6	120	80	36.666666666666664	70	\N	2026-01-24 16:07:45.608263+05:30	72	98	170
5	7	\N	\N	\N	\N	\N	2026-01-24 16:09:24.084099+05:30	\N	\N	\N
6	9	\N	\N	\N	\N	\N	2026-01-24 16:32:30.158185+05:30	\N	\N	12
7	10	\N	\N	37	70	\N	2026-01-24 16:33:44.000398+05:30	72	\N	180
9	13	12	12	-11.11111111111111	12	12	2026-01-25 15:16:11.658169+05:30	12	12	12
10	15	\N	\N	\N	\N	100	2026-01-25 16:47:33.652452+05:30	\N	\N	\N
8	12	\N	\N	\N	123	100	2026-01-25 15:15:26.988918+05:30	\N	\N	\N
11	16	120	80	37.5	70	100	2026-01-25 17:50:22.12006+05:30	72	98	180
12	17	120	80	37.5	70	100	2026-01-25 18:21:39.095088+05:30	72	98	180
13	18	120	80	12	12	12	2026-01-25 18:26:02.27817+05:30	\N	\N	\N
15	20	\N	\N	\N	\N	100	2026-02-14 15:58:17.719227+05:30	\N	\N	\N
16	21	120	60	37	88	132	2026-02-14 16:01:01.690873+05:30	66	98	177
14	19	120	80	37.77777777777778	70	99.8	2026-02-14 15:58:09.263862+05:30	72	98	170
17	22	110	80	37.111111111111114	80	121	2026-02-14 16:33:15.848848+05:30	88	98	178
18	23	120	80	37.77777777777778	70	99.8	2026-05-12 18:56:03.914704+05:30	72	98	170
19	24	120	80	37.77777777777778	70	99.8	2026-05-17 15:56:48.29832+05:30	72	98	170
20	26	120	80	37.5	70.2	100	2026-05-23 13:54:10.270531+05:30	72	98	180
21	27	120	80	37.77777777777778	70	99.8	2026-05-23 15:18:13.405707+05:30	72	98	170
22	28	120	80	37.77777777777778	70	99.8	2026-05-24 11:19:49.598877+05:30	72	98	170
24	30	120	80	36.666666666666664	60	115	2026-05-24 16:07:26.077064+05:30	76	90	180
23	29	120	80	37.22222222222222	60	114	2026-05-24 16:06:03.918119+05:30	76	90	180
25	31	120	80	37.77777777777778	70	99.8	2026-06-06 16:06:10.141811+05:30	72	98	170
26	32	123	87	37.166666666666664	65	112	2026-06-06 16:11:28.745564+05:30	99	98	177
27	33	123	87	37.166666666666664	65	112	2026-06-06 16:21:40.781254+05:30	99	98	177
29	35	120	80	37.77777777777778	70	99.8	2026-06-13 12:12:23.665261+05:30	72	98	170
30	36	60	60	32.22222222222222	39.8	20	2026-06-13 12:13:02.698158+05:30	69	34	20
31	37	60	60	90	39.8	20	2026-06-13 13:18:46.719467+05:30	69	34	20
32	38	123	87	98.9	65	112	2026-06-13 13:18:59.45099+05:30	99	98	177
28	34	\N	\N	\N	\N	\N	2026-06-13 12:11:55.065812+05:30	\N	\N	\N
33	39	120	80	36.666666666666664	60	115	2026-07-26 16:10:53.265631+05:30	76	90	180
\.


--
-- Name: chief_complaints_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.chief_complaints_master_id_seq', 17, true);


--
-- Name: diagnosis_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.diagnosis_master_id_seq', 7, true);


--
-- Name: doctor_advice_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.doctor_advice_master_id_seq', 15, true);


--
-- Name: lab_tests_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.lab_tests_master_id_seq', 6, true);


--
-- Name: medicine_brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.medicine_brands_id_seq', 1, true);


--
-- Name: medicine_dosages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.medicine_dosages_id_seq', 1, true);


--
-- Name: medicine_drugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.medicine_drugs_id_seq', 1, true);


--
-- Name: medicine_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.medicine_types_id_seq', 1, true);


--
-- Name: patient_allergy_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.patient_allergy_history_id_seq', 8, true);


--
-- Name: patient_family_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.patient_family_history_id_seq', 2, true);


--
-- Name: patient_past_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.patient_past_history_id_seq', 19, true);


--
-- Name: patient_surgical_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.patient_surgical_history_id_seq', 7, true);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.patients_id_seq', 8, true);


--
-- Name: prescription_drugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.prescription_drugs_id_seq', 54, true);


--
-- Name: prescriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.prescriptions_id_seq', 32, true);


--
-- Name: templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.templates_id_seq', 7, true);


--
-- Name: tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.tests_id_seq', 87, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: visit_complaints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.visit_complaints_id_seq', 208, true);


--
-- Name: visit_diagnosis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.visit_diagnosis_id_seq', 62, true);


--
-- Name: visit_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.visit_payments_id_seq', 6, true);


--
-- Name: visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.visits_id_seq', 39, true);


--
-- Name: vitals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: clinic_user
--

SELECT pg_catalog.setval('public.vitals_id_seq', 33, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: chief_complaints_master chief_complaints_master_name_key; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.chief_complaints_master
    ADD CONSTRAINT chief_complaints_master_name_key UNIQUE (name);


--
-- Name: chief_complaints_master chief_complaints_master_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.chief_complaints_master
    ADD CONSTRAINT chief_complaints_master_pkey PRIMARY KEY (id);


--
-- Name: diagnosis_master diagnosis_master_name_key; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.diagnosis_master
    ADD CONSTRAINT diagnosis_master_name_key UNIQUE (name);


--
-- Name: diagnosis_master diagnosis_master_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.diagnosis_master
    ADD CONSTRAINT diagnosis_master_pkey PRIMARY KEY (id);


--
-- Name: doctor_advice_master doctor_advice_master_name_key; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.doctor_advice_master
    ADD CONSTRAINT doctor_advice_master_name_key UNIQUE (name);


--
-- Name: doctor_advice_master doctor_advice_master_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.doctor_advice_master
    ADD CONSTRAINT doctor_advice_master_pkey PRIMARY KEY (id);


--
-- Name: lab_tests_master lab_tests_master_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.lab_tests_master
    ADD CONSTRAINT lab_tests_master_pkey PRIMARY KEY (id);


--
-- Name: medicine_brands medicine_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_brands
    ADD CONSTRAINT medicine_brands_pkey PRIMARY KEY (id);


--
-- Name: medicine_dosages medicine_dosages_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_dosages
    ADD CONSTRAINT medicine_dosages_pkey PRIMARY KEY (id);


--
-- Name: medicine_drugs medicine_drugs_name_key; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_drugs
    ADD CONSTRAINT medicine_drugs_name_key UNIQUE (name);


--
-- Name: medicine_drugs medicine_drugs_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_drugs
    ADD CONSTRAINT medicine_drugs_pkey PRIMARY KEY (id);


--
-- Name: medicine_types medicine_types_name_key; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_types
    ADD CONSTRAINT medicine_types_name_key UNIQUE (name);


--
-- Name: medicine_types medicine_types_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_types
    ADD CONSTRAINT medicine_types_pkey PRIMARY KEY (id);


--
-- Name: patient_allergy_history patient_allergy_history_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_allergy_history
    ADD CONSTRAINT patient_allergy_history_pkey PRIMARY KEY (id);


--
-- Name: patient_family_history patient_family_history_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_family_history
    ADD CONSTRAINT patient_family_history_pkey PRIMARY KEY (id);


--
-- Name: patient_past_history patient_past_history_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_past_history
    ADD CONSTRAINT patient_past_history_pkey PRIMARY KEY (id);


--
-- Name: patient_surgical_history patient_surgical_history_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_surgical_history
    ADD CONSTRAINT patient_surgical_history_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: prescription_drugs prescription_drugs_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.prescription_drugs
    ADD CONSTRAINT prescription_drugs_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_visit_id_key; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_visit_id_key UNIQUE (visit_id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: visit_complaints visit_complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_complaints
    ADD CONSTRAINT visit_complaints_pkey PRIMARY KEY (id);


--
-- Name: visit_diagnosis visit_diagnosis_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_diagnosis
    ADD CONSTRAINT visit_diagnosis_pkey PRIMARY KEY (id);


--
-- Name: visit_payments visit_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_payments
    ADD CONSTRAINT visit_payments_pkey PRIMARY KEY (id);


--
-- Name: visit_payments visit_payments_visit_id_key; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_payments
    ADD CONSTRAINT visit_payments_visit_id_key UNIQUE (visit_id);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: vitals vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_pkey PRIMARY KEY (id);


--
-- Name: vitals vitals_visit_id_key; Type: CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_visit_id_key UNIQUE (visit_id);


--
-- Name: ix_chief_complaints_master_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_chief_complaints_master_id ON public.chief_complaints_master USING btree (id);


--
-- Name: ix_chief_complaints_master_name; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_chief_complaints_master_name ON public.chief_complaints_master USING btree (name);


--
-- Name: ix_diagnosis_master_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_diagnosis_master_id ON public.diagnosis_master USING btree (id);


--
-- Name: ix_diagnosis_master_name; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_diagnosis_master_name ON public.diagnosis_master USING btree (name);


--
-- Name: ix_doctor_advice_master_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_doctor_advice_master_id ON public.doctor_advice_master USING btree (id);


--
-- Name: ix_doctor_advice_master_name; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_doctor_advice_master_name ON public.doctor_advice_master USING btree (name);


--
-- Name: ix_lab_tests_master_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_lab_tests_master_id ON public.lab_tests_master USING btree (id);


--
-- Name: ix_lab_tests_master_name; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_lab_tests_master_name ON public.lab_tests_master USING btree (name);


--
-- Name: ix_medicine_brands_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_medicine_brands_id ON public.medicine_brands USING btree (id);


--
-- Name: ix_medicine_brands_name; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_medicine_brands_name ON public.medicine_brands USING btree (name);


--
-- Name: ix_medicine_dosages_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_medicine_dosages_id ON public.medicine_dosages USING btree (id);


--
-- Name: ix_medicine_dosages_label; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_medicine_dosages_label ON public.medicine_dosages USING btree (label);


--
-- Name: ix_medicine_drugs_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_medicine_drugs_id ON public.medicine_drugs USING btree (id);


--
-- Name: ix_medicine_drugs_name; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_medicine_drugs_name ON public.medicine_drugs USING btree (name);


--
-- Name: ix_medicine_types_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_medicine_types_id ON public.medicine_types USING btree (id);


--
-- Name: ix_medicine_types_name; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_medicine_types_name ON public.medicine_types USING btree (name);


--
-- Name: ix_patient_allergy_history_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patient_allergy_history_id ON public.patient_allergy_history USING btree (id);


--
-- Name: ix_patient_allergy_history_patient_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patient_allergy_history_patient_id ON public.patient_allergy_history USING btree (patient_id);


--
-- Name: ix_patient_family_history_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patient_family_history_id ON public.patient_family_history USING btree (id);


--
-- Name: ix_patient_family_history_patient_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patient_family_history_patient_id ON public.patient_family_history USING btree (patient_id);


--
-- Name: ix_patient_past_history_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patient_past_history_id ON public.patient_past_history USING btree (id);


--
-- Name: ix_patient_past_history_patient_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patient_past_history_patient_id ON public.patient_past_history USING btree (patient_id);


--
-- Name: ix_patient_surgical_history_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patient_surgical_history_id ON public.patient_surgical_history USING btree (id);


--
-- Name: ix_patient_surgical_history_patient_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patient_surgical_history_patient_id ON public.patient_surgical_history USING btree (patient_id);


--
-- Name: ix_patients_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patients_id ON public.patients USING btree (id);


--
-- Name: ix_patients_name; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patients_name ON public.patients USING btree (name);


--
-- Name: ix_patients_phone; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_patients_phone ON public.patients USING btree (phone);


--
-- Name: ix_prescription_drugs_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_prescription_drugs_id ON public.prescription_drugs USING btree (id);


--
-- Name: ix_prescriptions_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_prescriptions_id ON public.prescriptions USING btree (id);


--
-- Name: ix_templates_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_templates_id ON public.templates USING btree (id);


--
-- Name: ix_tests_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_tests_id ON public.tests USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: ix_visit_complaints_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_visit_complaints_id ON public.visit_complaints USING btree (id);


--
-- Name: ix_visit_complaints_visit_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_visit_complaints_visit_id ON public.visit_complaints USING btree (visit_id);


--
-- Name: ix_visit_diagnosis_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_visit_diagnosis_id ON public.visit_diagnosis USING btree (id);


--
-- Name: ix_visit_diagnosis_visit_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_visit_diagnosis_visit_id ON public.visit_diagnosis USING btree (visit_id);


--
-- Name: ix_visit_payments_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_visit_payments_id ON public.visit_payments USING btree (id);


--
-- Name: ix_visit_payments_visit_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_visit_payments_visit_id ON public.visit_payments USING btree (visit_id);


--
-- Name: ix_visits_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_visits_id ON public.visits USING btree (id);


--
-- Name: ix_visits_visit_number; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE UNIQUE INDEX ix_visits_visit_number ON public.visits USING btree (visit_number);


--
-- Name: ix_vitals_id; Type: INDEX; Schema: public; Owner: clinic_user
--

CREATE INDEX ix_vitals_id ON public.vitals USING btree (id);


--
-- Name: medicine_brands medicine_brands_drug_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_brands
    ADD CONSTRAINT medicine_brands_drug_id_fkey FOREIGN KEY (drug_id) REFERENCES public.medicine_drugs(id);


--
-- Name: medicine_brands medicine_brands_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_brands
    ADD CONSTRAINT medicine_brands_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.medicine_types(id);


--
-- Name: medicine_dosages medicine_dosages_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.medicine_dosages
    ADD CONSTRAINT medicine_dosages_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.medicine_brands(id);


--
-- Name: patient_allergy_history patient_allergy_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_allergy_history
    ADD CONSTRAINT patient_allergy_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_family_history patient_family_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_family_history
    ADD CONSTRAINT patient_family_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_past_history patient_past_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_past_history
    ADD CONSTRAINT patient_past_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_surgical_history patient_surgical_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.patient_surgical_history
    ADD CONSTRAINT patient_surgical_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: prescription_drugs prescription_drugs_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.prescription_drugs
    ADD CONSTRAINT prescription_drugs_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id);


--
-- Name: prescriptions prescriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: prescriptions prescriptions_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: templates templates_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: tests tests_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: visit_complaints visit_complaints_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_complaints
    ADD CONSTRAINT visit_complaints_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.chief_complaints_master(id);


--
-- Name: visit_complaints visit_complaints_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_complaints
    ADD CONSTRAINT visit_complaints_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: visit_diagnosis visit_diagnosis_diagnosis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_diagnosis
    ADD CONSTRAINT visit_diagnosis_diagnosis_id_fkey FOREIGN KEY (diagnosis_id) REFERENCES public.diagnosis_master(id);


--
-- Name: visit_diagnosis visit_diagnosis_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_diagnosis
    ADD CONSTRAINT visit_diagnosis_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: visit_payments visit_payments_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visit_payments
    ADD CONSTRAINT visit_payments_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: visits visits_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: visits visits_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: vitals vitals_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clinic_user
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO clinic_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: mac
--

ALTER DEFAULT PRIVILEGES FOR ROLE mac IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: mac
--

ALTER DEFAULT PRIVILEGES FOR ROLE mac IN SCHEMA public GRANT ALL ON TABLES TO clinic_user;


--
-- PostgreSQL database dump complete
--

\unrestrict 0Gp7z6mxkgzQHZY0sTY48GqxVOHRDjHegntaq1wb6NhvSJBlRdcc0412CSb8r0M

