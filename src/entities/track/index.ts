export interface Track {
  symbol: string;
  highPrice: number;
  lowPrice: number;
  createdAt: string;
  causes: string[];
  direction?: 'green' | 'red';
  lowStopPrice?: number;
  highStopPrice?: number;
  isOrder: boolean
}
