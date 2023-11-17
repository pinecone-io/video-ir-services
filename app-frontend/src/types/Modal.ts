export type ModalProps = {
  title?: string;
  paragraph?: string;
  status?: boolean;
  button?: boolean;
  buttonText?: string;
  onClose?: () => void;
};
