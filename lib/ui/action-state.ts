export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  redirectTo?: string;
};

export const initialActionState: ActionState = { status: "idle" };
