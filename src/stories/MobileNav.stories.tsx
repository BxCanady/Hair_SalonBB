import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MobileNav from "@/components/ui/MobileNav";

const meta: Meta<typeof MobileNav> = {
  title: "Navigation/MobileNav",
  component: MobileNav,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export default meta;

type Story = StoryObj<typeof MobileNav>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-neutral-50">
      <main className="p-4 pb-24">
        <h1 className="text-2xl font-bold">
          Breast@Braid
        </h1>

        <p className="mt-2 text-neutral-600">
          Mobile nav preview
        </p>
      </main>

      <MobileNav />
    </div>
  ),
};