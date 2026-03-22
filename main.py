"""
AURA Preprocessor 2.0 - Main Entry Point

Dataset-agnostic preprocessing pipeline with comprehensive reporting and LLM explanations.
"""

import sys
import os
from backend.backend.core.pipeline import AuraPipeline

def main():
    """Main function to run the AURA Preprocessor 2.0 pipeline."""
    print("=" * 60)
    print("🚀 AURA PREPROCESSOR 2.0")
    print("Dataset-Agnostic ML Pipeline with LLM Explanations")
    print("=" * 60)
    
    # Configuration
    dataset_path = "data/titanic.csv"  # Can be changed to any CSV file
    mode = "auto"  # "auto" or "step"
    target_column = None  # Auto-detect if None
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        dataset_path = sys.argv[1]
    if len(sys.argv) > 2:
        mode = sys.argv[2]
    if len(sys.argv) > 3:
        target_column = sys.argv[3]
    
    try:
        # Initialize pipeline
        print(f"\n📁 Loading dataset: {dataset_path}")
        pipeline = AuraPipeline(
            filepath=dataset_path,
            mode=mode,
            target_col=target_column
        )
        
        # Display dataset information
        dataset_info = pipeline.get_dataset_info()
        print(f"\n📊 Dataset Information:")
        print(f"   Shape: {dataset_info['shape']}")
        print(f"   Columns: {len(dataset_info['columns'])}")
        print(f"   Numeric: {len(dataset_info['numeric_columns'])}")
        print(f"   Categorical: {len(dataset_info['categorical_columns'])}")
        print(f"   Missing values: {sum(dataset_info['missing_values'].values())}")
        
        # Run the complete pipeline
        results = pipeline.run_full_pipeline(
            test_size=0.2,
            save_data=True,
            save_explanations=True
        )
        
        if results["success"]:
            print("\n🎉 Pipeline completed successfully!")
            print(f"📊 Model accuracy: {results['model_results']['results']['accuracy']:.4f}")
            print(f"📁 Processed data saved to: {results.get('processed_data_path', 'N/A')}")
            print(f"📋 Report saved to: outputs/report.json")
            print(f"🤖 Explanations saved to: outputs/aura_explanations.json")
        else:
            print(f"\n❌ Pipeline failed: {results.get('error', 'Unknown error')}")
            return 1
            
    except FileNotFoundError:
        print(f"\n❌ Error: Dataset file '{dataset_path}' not found!")
        print("Please ensure the file exists and the path is correct.")
        return 1
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
