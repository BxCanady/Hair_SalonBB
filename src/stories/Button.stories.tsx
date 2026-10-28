import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "../components/ui/Button";

const meta: Meta<typeof Button> = {
  title: "Salon/Button",
  component: Button,
};

export default meta;

type Story = StoryObj<typeof Button>;

export const BookNow: Story = {
  args: {
    children: "Book Now",
  },
};

export const StaffLogin: Story = {
  args: {
    children: "Owner Login",
  },
};

export const Secondary: Story = {
  args: {
    children: "View Styles",
    variant: "secondary",
  },
};