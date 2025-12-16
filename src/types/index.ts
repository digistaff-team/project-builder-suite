export enum BookStatus {
  AVAILABLE = 'свободна',
  BORROWED = 'на руках'
}

export enum CoverType {
  SOFT = 'мягкая',
  HARD = 'твердая'
}

export enum ConditionState {
  NEW = 'новая',
  GOOD = 'хорошее',
  AVERAGE = 'среднее',
  BAD = 'плохое'
}

export interface Book {
  id: number;
  title: string;
  author: string;
  cover_type: CoverType;
  publication_year: number;
  genre: string;
  page_count: number;
  condition_state: ConditionState;
  status: BookStatus;
  borrowed_date?: string | null;
  borrower_phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface Reader {
  phone: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  registration_date: string;
}

export interface ReaderFormData {
  phone: string;
  firstName: string;
  lastName: string;
  dob: string;
}

export interface BookFormData {
  title: string;
  author: string;
  coverType: CoverType;
  publicationYear: number;
  genre: string;
  pageCount: number;
  conditionState: ConditionState;
  status: BookStatus;
}

export interface ApiResponse {
  message?: string;
  error?: string;
  id?: string | number;
}
