# 🛡️ Branch Protection Policy

## Main Branch Protection Rules

The `main` branch has the following protection rules in place:

### 🚫 No Deletion Policy

- **Branch Deletion**: The `main` branch **CANNOT** be deleted
- **Reason**: The main branch is the primary branch of the repository and contains the production-ready code
- **Protection Level**: Enforced at repository settings level

### 📋 How to Configure

To set up main branch protection on GitHub:

1. 🔧 Navigate to your repository on GitHub
2. ⚙️ Click on **Settings** tab
3. 🔒 Select **Branches** from the left sidebar
4. ➕ Click **Add branch protection rule**
5. 📝 Enter `main` as the branch name pattern
6. ✅ Configure the following settings:
   - ☑️ Check "Lock branch" to prevent deletion
   - ☑️ Check "Do not allow bypassing the above settings" (if available)
7. 💾 Click **Create** or **Save changes**

### 🎯 Additional Recommended Protections

Consider enabling these additional protections for the main branch:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require linear history
- ✅ Include administrators in these restrictions

### 📚 More Information

For detailed information about branch protection rules, visit:
- [GitHub Docs - About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

**Note**: Branch protection rules require admin permissions to configure. If you don't have admin access, contact the repository owner.
