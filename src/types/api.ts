// Shapes returned by the mobile API (`/api/mobile/v1`). Mirrors
// `src/lib/mobile/dto.ts` in the Next.js repo — see its `docs/api-mobile.md`
// for the full contract. Kept as the single source of truth for these shapes;
// nothing outside `src/services` should read a raw fetch response.

export type UserRole = "member" | "admin";
export type MemberType = "freelance" | "entreprise" | "etudiant" | null;

export type MeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  memberType: MemberType;
  credits: number;
  onboardingCompleted: boolean;
};

export type LocationDto = {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
};

export type SpaceDto = {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerHour: number;
};

export type CheckInState = "available" | "too_early" | "expired" | "done" | "unavailable";

export type CheckInEligibility = {
  state: CheckInState;
  opensAt: string;
  closesAt: string;
  doneAt: string | null;
};

export type ReservationStatus = "confirmed" | "cancelled" | "completed";

export type ReservationDto = {
  id: string;
  status: ReservationStatus;
  startAt: string;
  endAt: string;
  creditsSpent: number;
  createdAt: string;
  space: SpaceDto;
  location: LocationDto;
  checkIn: CheckInEligibility;
};

// A refused attempt is still a normal, 201 response — never an error.
export type CheckInReason =
  | "NOT_CONFIRMED"
  | "TOO_EARLY"
  | "TOO_LATE"
  | "LOW_ACCURACY"
  | "STALE_POSITION"
  | "TOO_FAR";

export type CheckInDto = {
  id: string;
  reservationId: string;
  accepted: boolean;
  reason: CheckInReason | null;
  distanceM: number;
  accuracyM: number;
  createdAt: string;
};

export type CheckInHistoryDto = CheckInDto & {
  reservation: {
    id: string;
    startAt: string;
    endAt: string;
    space: SpaceDto;
    location: LocationDto;
  };
};

export type Page<T> = { items: T[]; nextCursor: string | null };

export type NearbySpace = {
  space: SpaceDto;
  location: LocationDto;
  distanceM: number | null;
  estimatedCredits: number;
};

export type NearbyResult = {
  slot: { startAt: string; endAt: string };
  hasPosition: boolean;
  items: NearbySpace[];
};

export type AuthResult = { token: string; expiresAt: string; user: MeUser };

// Every error code the API documents (docs/api-mobile.md) — kept as a union
// so a `switch` on `error.code` gets exhaustiveness checking; `string` is
// still accepted as a fallback for a code this client doesn't know about yet.
export type ApiErrorCode =
  | "INVALID_JSON"
  | "UNAUTHENTICATED"
  | "INVALID_TOKEN"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED"
  | "INVALID_CREDENTIALS"
  | "INSUFFICIENT_CREDITS"
  | "RESERVATION_NOT_FOUND"
  | "SPACE_NOT_FOUND"
  | "EMAIL_TAKEN"
  | "SLOT_TAKEN"
  | "SPACE_UNAVAILABLE"
  | "NOT_CANCELLABLE"
  | "ALREADY_STARTED"
  | "ALREADY_CHECKED_IN"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "SLOT_IN_PAST"
  | "SLOT_TOO_SHORT"
  | "SLOT_TOO_LONG"
  | "TOO_MANY_ATTEMPTS"
  | "INTERNAL_ERROR"
  | (string & {});
