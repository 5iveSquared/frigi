import { FrigiLoader } from '~/components/ui/FrigiLoader';

interface Props {
  size?: number;
}

export function LoadingSpinner({ size = 48 }: Props) {
  return <FrigiLoader size={size} />;
}
