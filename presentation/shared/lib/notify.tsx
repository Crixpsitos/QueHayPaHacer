import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";

interface NotifyOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface PromiseMessages<T> {
  loading: string;
  success: (data: T) => string;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: string | ((error: any) => string);
}

export const notify = {
  success: (title: string, options?: NotifyOptions) => {
    toast.custom(
      (t) => <CustomToast t={t} type="success" title={title} {...options} />,
      { duration: 4000 },
    );
  },
  error: (title: string, options?: NotifyOptions) => {
    toast.custom(
      (t) => <CustomToast t={t} type="error" title={title} {...options} />,
      { duration: 5000 },
    );
  },
  warning: (title: string, options?: NotifyOptions) => {
    toast.custom(
      (t) => <CustomToast t={t} type="warning" title={title} {...options} />,
      { duration: 4000 },
    );
  },
  info: (title: string, options?: NotifyOptions) => {
    toast.custom(
      (t) => <CustomToast t={t} type="info" title={title} {...options} />,
      { duration: 4000 },
    );
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options?: NotifyOptions,
  ) => {
    const toastId = toast.custom(
      (t) => (
        <CustomToast t={t} type="info" title={messages.loading} {...options} />
      ),
      { duration: Infinity },
    );

    promise
      .then((data) => {
        const title =
          typeof messages.success === "function"
            ? messages.success(data)
            : messages.success;

        toast.custom(
          (t) => (
            <CustomToast t={t} type="success" title={title} {...options} />
          ),
          { id: toastId, duration: 4000 },
        );
        return data;
      })
      .catch((err) => {
        const title =
          typeof messages.error === "function"
            ? messages.error(err)
            : messages.error;

        toast.custom(
          (t) => <CustomToast t={t} type="error" title={title} {...options} />,
          { id: toastId, duration: 5000 },
        );
      });

    return promise;
  },
};
