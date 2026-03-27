#!/bin/bash
# Script de mise à jour de l'app native
# À exécuter après chaque déploiement important

echo "🔄 Sync Capacitor..."
npx cap sync
echo "✅ Sync terminé"
echo ""
echo "Pour builder :"
echo "  iOS     : npx cap open ios     (nécessite Xcode sur Mac)"
echo "  Android : npx cap open android (nécessite Android Studio)"
