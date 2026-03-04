
# quickLOG — Product Summary

> Production management & food safety compliance — from the factory floor to the customer's door.

**quickLOG** replaces paper logs, binders, and spreadsheets with a single web platform connecting the production floor, QA team, and management — built for food manufacturers who need real compliance, not just paperwork.

---

## Core Modules

### 1. Live CCP Monitoring
Real-time oven temperature recording against configurable time windows. Automatic alerts when readings are overdue. Deviation & corrective action documentation on the spot. Every action is timestamped and tied to a specific batch, creating a regulatory-ready audit trail with no manual paperwork.

### 2. QA Verification Workflow
Multi-stage sign-off queue. QA reviews temperature data, confirms ingredient lot codes, records yields and scrap, and finalises each batch before it enters inventory. No batch reaches inventory or traceability without a QA sign-off.

### 3. Bi-Directional Traceability
- **Forward:** lot code → every customer it was shipped to
- **Reverse:** ingredient lot code → every finished product and customer

Cuts recall investigation time from days to minutes.

### 4. Inventory & Orders
Lot-code–level stock balances updated in real time by production and shipments. Assign lot codes to customer orders at dispatch. Full order history linked to source batches.

### 5. Environmental (ATP) Monitoring
Log swab test RLU values by zone and location. Automatic PASS/FAIL against configurable zone thresholds. Retest SLA tracking. Zone-based trend charts for ongoing hygiene programs.

### 6. Complaint Management
Log internal or customer complaints with category, severity, source, and CAPA flag. Guided action suggestions by type. Trend analysis to monitor whether rates are improving over time.

### 7. Production & Labor Analytics
Units produced, labor cost/unit, hours per 1,000 units, and productivity KPIs — aggregated monthly with prior-period delta. Date-range and product-level drill-down.

| Dashboard | Key Metrics |
|---|---|
| Production & Labor | Units produced, labor cost / unit, units per employee, labor hours per 1,000 units |
| Ingredient Variance | Expected vs. actual usage (kg) and cost variance per product/ingredient |
| Complaints | Category breakdown, severity trend, CAPA rate |
| Environmental | Zone pass rates, RLU averages, retest frequency |

### 8. Ingredient Cost & Variance
Track current ingredient prices. Compare expected vs. actual usage per batch. Automatic cost/unit calculation from recipe. Variance highlights when actual spend drifts from recipe.

### 9. Price Calculator
Built-in tool for product pricing strategy: input recipe cost + packaging + labor cost (manually or pulled from the analytics DB by time period), then model the full 3-level pricing chain — Manufacturer gross margin → Distributor markup → Retailer markup — fully bidirectional.

### 10. Admin — Products, Recipes & Costs
Define products with ingredient recipes (expected quantities per unit). The system tracks current ingredient prices and automatically computes estimated cost per unit.

---

## Access Control

Four roles with 16 granular permission modules:

| Role | Access |
|---|---|
| **Admin** | Everything |
| **QA** | All production + analytics + admin modules |
| **Factory Team** | Production floor, live CCP, inventory, orders |
| **Client Portal** | Read-only traceability for customer account access |

---

## Compliance & Regulatory Readiness

- **HACCP / CCP alignment** — CCP monitoring with documented thresholds, deviations, and corrective actions
- **SQF / FSSC 22000 aligned** — audit trail workflows match food safety scheme requirements
- **FSMA Traceability Rule** — bi-directional lot code traceability from ingredient to customer
- **Full audit trail** — every reading, sign-off, and change is timestamped and user-attributed
- **CAPA tracking** — complaint-linked corrective and preventive action documentation

---

## Target Industries

Any food manufacturer currently using paper logs or spreadsheets for CCP monitoring, batch records, or quality workflows:

- Bakeries
- Prepared Foods
- Meat & Seafood
- Dairy
- Snacks & Confectionery
- Sauces & Condiments

---

## Technical Specs

- **Web-based** — no software to install; works on desktop, tablet, and mobile on the production floor
- **Multi-tenant** — multiple facilities/companies in a single deployment; all records are company-scoped at the database level
- **Role-gated API** — every backend endpoint enforces authentication and permission checks
- **Stack:** React · Node.js / Express · SQL Database (Sequelize ORM) · JWT Auth · Bootstrap 5

---

# Deployment & Dev Notes

# Push updates
For the backend push the updates using the command
### `git push heroku-pizzacini-quicklog main`
### `git push heroku-mimi-quicklog main`

This way the same code is uploaded to both heroku deployments.

The frontend is deployed in netlify. The deployment is connected to github, so when an update is pushed to github the production deployment gets automatically update.


# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
