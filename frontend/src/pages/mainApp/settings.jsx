function Settings() {
  return (
    <section className="placeholder-page settings-page">
      <h2>Settings</h2>
      <button className="button settings-signout" type="button" onClick={() => window.signout?.()}>
        Sign out
      </button>
    </section>
  );
}

export default Settings;
