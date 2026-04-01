import { useSnackbar } from "notistack";

const useToast = () => {
  const { enqueueSnackbar } = useSnackbar();

  const toast = {
    success: (msg) => enqueueSnackbar(msg, { variant: "success" }),
    error: (msg) => enqueueSnackbar(msg, { variant: "error" }),
    warning: (msg) => enqueueSnackbar(msg, { variant: "warning" }),
    info: (msg) => enqueueSnackbar(msg, { variant: "info" }),
  };

  return toast;
};

export default useToast;
