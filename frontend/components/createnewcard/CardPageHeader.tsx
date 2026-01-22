import SwitchTab, { SwitchTabItem } from '@/components/SwitchTab';

interface Props {
  title: string;
}

export default function CardPageHeader({ title }: Props) {
  const tabs: SwitchTabItem[] = [
    {
      label: 'FWC',
      path: '/dashboard/superadmin/createnewcard/fwc',
      match: /\/fwc/,
    },
    {
      label: 'Voucher',
      path: '/dashboard/superadmin/createnewcard/voucher',
      match: /\/voucher/,
    },
  ];

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <SwitchTab items={tabs} />
    </div>
  );
}
