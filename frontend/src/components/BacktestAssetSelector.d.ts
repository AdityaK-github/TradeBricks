declare module './components/BacktestAssetSelector' {
    interface BacktestAssetSelectorProps {
        onSelect: (asset: any) => void;
        className?: string;
    }

    const BacktestAssetSelector: React.FC<BacktestAssetSelectorProps>;
    export default BacktestAssetSelector;
} 