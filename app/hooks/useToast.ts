/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { toast as sonnerToast } from 'react-toastify';

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'error';

interface ToastProps {
  title: string;
  description: string;
  variant: ToastVariant;
}
export const useToast = () => {
  return {
        toast: (props: {
          title: string;
          description?: string;
          variant?: 'default' | 'destructive' | 'success' | 'loading';
          id?: string;
        }) => {
          const { title, description, variant, id } = props;
          
          switch (variant) {
            case 'loading':
              return sonnerToast.loading(description || title, { toastId: id });
            case 'success':
              return sonnerToast.success(description || title, { toastId: id });
            case 'destructive':
              return sonnerToast.error(description || title, { toastId: id });
            default:
              return sonnerToast(description || title, { toastId: id });
          }
        }
      };
    };