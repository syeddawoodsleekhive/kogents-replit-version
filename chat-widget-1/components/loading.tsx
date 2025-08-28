interface LoadingProps {
  color?: string; // Spinner color (optional)
}

const Loading = ({ color }: LoadingProps) => {
  return (
    <div className="flex justify-center items-center h-full w-full bg-white z-0">
      <div
        className="w-8 h-8 border-4 border-t-4 border-solid rounded-full animate-spin"
        style={{
          borderColor: `${color} transparent transparent transparent`, // Dynamic color applied to top border
        }}
      />
    </div>
  );
};

export default Loading;
