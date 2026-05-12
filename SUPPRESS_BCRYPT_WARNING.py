"""
Suppress bcrypt warnings by patching passlib
Run this once to suppress the harmless bcrypt version warnings
"""
import warnings
import sys

# Suppress the specific bcrypt AttributeError warnings
warnings.filterwarnings('ignore', category=AttributeError, module='passlib.handlers.bcrypt')

# Also suppress in stderr
import logging
logging.getLogger('passlib').setLevel(logging.ERROR)

print("✅ Bcrypt warnings suppressed")
