export interface FeedbackModalProps {
  title?: string;
  label?: string;
  onSubmit: (message: string) => void;
  onClose: () => void;
}
