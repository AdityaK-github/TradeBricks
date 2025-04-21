declare module './components/BacktestAssetSelector' {
    interface BacktestAssetSelectorProps {
        onSelect: (asset: {
            symbol: string;
            name: string;
            address?: string;
            assetType?: string;
            price?: number;
        }) => void;
        className?: string;
    }

    const BacktestAssetSelector: React.FC<BacktestAssetSelectorProps>;
    export default BacktestAssetSelector;
} 