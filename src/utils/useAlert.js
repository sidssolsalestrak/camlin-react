import { useSnackbar } from 'notistack';

export const useAlert = () => {
    const { enqueueSnackbar } = useSnackbar();

    const showAlert = (message, variant = "success") => {
        enqueueSnackbar(message, {
            variant,
            anchorOrigin: { vertical: "top", horizontal: "center" },
        });
    };

    return { showAlert };
};